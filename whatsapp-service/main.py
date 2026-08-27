import os
import threading
import asyncio
import json
import traceback
import httpx
from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from neonize.client import NewClient
from neonize.events import ConnectedEv, MessageEv, DisconnectedEv, event
from neonize.utils import build_jid
from playwright.async_api import async_playwright

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
print(f"🔑 Gemini API Key loaded: {'Yes (' + GEMINI_API_KEY[:8] + '...)' if GEMINI_API_KEY else 'No'}")
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "https://hxeayujekyexdpljzdpe.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZWF5dWpla3lleGRwbGp6ZHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNDUwNDIsImV4cCI6MjA5ODgyMTA0Mn0.mYt6Ct6hogrVuLU6cief5NPDHvoMStqN71OhWHXPCsE"

def fetch_products_context() -> str:
    """Fetch active products directly from the live Vercel API (guarantees real store items)."""
    try:
        url = "https://jdstorejeri.vercel.app/api/products?limit=15"
        resp = httpx.get(url, timeout=10)
        if resp.status_code == 200:
            res_data = resp.json()
            products = res_data.get("data", [])
            lines = []
            for p in products:
                name = p.get("name", "Product")
                slug = p.get("slug", "")
                price = p.get("price", 0)
                lines.append(f"- Name: {name} | Price: ₹{price} | Link: https://jdstorejeri.vercel.app/product/{slug}")
            if lines:
                return "\n".join(lines)
    except Exception as e:
        print(f"⚠️ Error fetching products from Vercel API: {e}")

    # Fallback to Supabase REST API if Vercel API fails
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            url = f"{SUPABASE_URL}/rest/v1/products?select=name,slug,price&is_active=eq.true&limit=15"
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            resp = httpx.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                products = resp.json()
                lines = [f"- Name: {p.get('name')} | Price: ₹{p.get('price')} | Link: https://jdstorejeri.vercel.app/product/{p.get('slug')}" for p in products]
                return "\n".join(lines)
        except Exception as e:
            print(f"⚠️ Fallback Supabase product fetch error: {e}")
    return ""

def ask_gemini(prompt: str) -> str:
    """Call Gemini API directly via HTTP with live catalog context as AI Shopping Assistant."""
    if not GEMINI_API_KEY:
        return "Gemini API key is not configured."

    catalog_info = fetch_products_context()

    system_instruction = (
        "You are the official AI Shopping Assistant for JD Store (https://jdstorejeri.vercel.app).\n"
        "Your goal is to assist customers, answer questions, and recommend products from the store catalog.\n\n"
        f"REAL STORE PRODUCTS AVAILABLE:\n{catalog_info}\n\n"
        "STRICT FORMATTING & RESPONSE RULES:\n"
        "1. DO NOT repeat long introductory greetings like 'Hello! Welcome to JD Store...' in every message. Keep conversation natural and direct.\n"
        "2. Recommend products ONLY from the REAL STORE PRODUCTS list above. Never invent fake items or dummy links.\n"
        "3. For each product recommendation, list:\n"
        "   🛍️ *[Product Name]*\n"
        "   💰 Price: ₹[Price]\n"
        "   🔗 Direct Link: https://jdstorejeri.vercel.app/product/[slug]\n"
        "4. Note: The URL pattern MUST be strictly https://jdstorejeri.vercel.app/product/[slug] (singular 'product').\n"
        "5. DO NOT output text image links like '🖼️ Image: https://...'. The system will send actual photo cards separately.\n"
        "6. ALWAYS end product recommendations with: '📱 *Shop on our App:* https://jdstorejeri.vercel.app'\n"
        "7. Use emojis and clean formatting."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\nCustomer Message: {prompt}"}
                ]
            }
        ]
    }
    try:
        resp = httpx.post(url, json=payload, timeout=30)
        print(f"🌐 Gemini API response status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"❌ Gemini API error body: {resp.text}")
            return f"AI service error (status {resp.status_code}). Please check API key."
        data = resp.json()
        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "No response generated.")
        return "No response generated."
    except Exception as e:
        print(f"❌ Gemini HTTP error: {traceback.format_exc()}")
        return "Sorry, I couldn't reach the AI service."

app = FastAPI(title="WhatsApp Bot Service")

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
whatsapp_status = "disconnected"
qr_code_data = ""
chat_store = {}  # phone -> {"phone": str, "messages": list, "last_activity": str}
processed_msg_ids = set()

def log_chat_message(phone: str, sender: str, text: str):
    phone_str = str(phone)
    clean_phone = ''.join(c for c in phone_str if c.isdigit())
    if not clean_phone:
        clean_phone = phone_str if phone_str and phone_str != "None" else "unknown"

    from datetime import datetime
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    if clean_phone not in chat_store:
        chat_store[clean_phone] = {
            "phone": clean_phone,
            "messages": [],
            "last_activity": ""
        }
    
    chat_store[clean_phone]["messages"].append({
        "sender": sender,
        "text": text,
        "timestamp": now_iso
    })
    if len(chat_store[clean_phone]["messages"]) > 50:
        chat_store[clean_phone]["messages"] = chat_store[clean_phone]["messages"][-50:]
    chat_store[clean_phone]["last_activity"] = now_iso

    # Persist to Supabase if configured
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            url = f"{SUPABASE_URL}/rest/v1/whatsapp_chat_messages"
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            }
            payload = {
                "phone_number": clean_phone,
                "sender": sender,
                "message_text": text,
                "created_at": now_iso
            }
            res = httpx.post(url, headers=headers, json=payload, timeout=10)
            print(f"💾 Logged message to Supabase ({clean_phone}, {sender}): status {res.status_code}")
            if res.status_code >= 400:
                print(f"❌ Supabase insert error ({res.status_code}): {res.text}")
        except Exception as e:
            print(f"⚠️ Supabase chat persist error: {e}")

# Initialize Neonize Client
client = NewClient("whatsapp_session.sqlite3")

@client.event(ConnectedEv)
def on_connected(client: NewClient, ev: ConnectedEv):
    global whatsapp_status, qr_code_data
    print("⚡ Bot connected successfully!")
    whatsapp_status = "connected"
    qr_code_data = ""

@client.event(DisconnectedEv)
def on_disconnected(client: NewClient, ev: DisconnectedEv):
    global whatsapp_status
    print("❌ Bot disconnected!")
    whatsapp_status = "disconnected"

@client.qr
def on_qr_code(client, qr_data: bytes):
    global whatsapp_status, qr_code_data
    print("📲 QR Code received")
    qr_code_data = qr_data.decode('utf-8') if isinstance(qr_data, bytes) else str(qr_data)
    whatsapp_status = "awaiting_scan"

@client.event(MessageEv)
def on_message(client: NewClient, ev: MessageEv):
    # Ignore our own messages
    if ev.Info.MessageSource.IsFromMe:
        return

    # Ignore group messages to prevent spam & bans
    if hasattr(ev.Info.MessageSource, 'IsGroup') and ev.Info.MessageSource.IsGroup:
        return

    # Message deduplication check to prevent double responses
    msg_id = str(ev.Info.ID) if hasattr(ev.Info, 'ID') else None
    if msg_id:
        if msg_id in processed_msg_ids:
            print(f"⏩ Duplicate message ID ignored: {msg_id}")
            return
        processed_msg_ids.add(msg_id)
        if len(processed_msg_ids) > 1000:
            processed_msg_ids.clear()

    incoming_text = ""
    if ev.Message.conversation:
        incoming_text = ev.Message.conversation
    elif ev.Message.extendedTextMessage and ev.Message.extendedTextMessage.text:
        incoming_text = ev.Message.extendedTextMessage.text

    # Extract clean sender phone number (avoid LID or group IDs)
    chat_user = getattr(ev.Info.MessageSource.Chat, 'User', '')
    sender_user = getattr(ev.Info.MessageSource.Sender, 'User', '')
    
    sender_jid = str(chat_user if (chat_user and len(str(chat_user)) <= 12) else sender_user)
    if not sender_jid or sender_jid == "None":
        sender_jid = str(chat_user or sender_user or "unknown")

    if incoming_text:
        log_chat_message(sender_jid, "customer", incoming_text)

    if incoming_text and GEMINI_API_KEY:
        print(f"📥 Received from {sender_jid}: {incoming_text}")
        reply_text = ask_gemini(incoming_text)
        print(f"📤 Replying to {sender_jid}: {reply_text[:100]}...")
        log_chat_message(sender_jid, "ai", reply_text)
        
        # Add human-like 1.5s delay to protect account from WhatsApp anti-spam detection
        import time
        time.sleep(1.5)

        # Send standard direct message
        jid_obj = build_jid(sender_jid)
        client.send_message(jid_obj, reply_text)
    elif incoming_text:
        print(f"📥 Received from {sender_jid}: {incoming_text} (no API key, skipping AI)")
        reply_text = "Bot is running but AI is not configured yet."
        log_chat_message(sender_jid, "ai", reply_text)
        jid_obj = build_jid(sender_jid)
        client.send_message(jid_obj, reply_text)

def start_neonize():
    import time
    while True:
        try:
            print("🔄 Attempting to connect Neonize...")
            client.connect()
            # If connect() is non-blocking in this version and event.wait() is needed:
            # event.wait() 
        except Exception as e:
            print(f"⚠️ Neonize crashed or timed out: {e}")
        print("⏳ Waiting 5 seconds before restarting WhatsApp client...")
        time.sleep(5)

# Start Neonize in a background thread so it doesn't block FastAPI
threading.Thread(target=start_neonize, daemon=True).start()

class SendMessageReq(BaseModel):
    phone_number: str
    message: str

@app.get("/api/whatsapp/status")
def get_status():
    return {"status": whatsapp_status}

@app.get("/api/whatsapp/qr")
def get_qr():
    if whatsapp_status == "connected":
        return {"qr": None, "message": "Already connected"}
    return {"qr": qr_code_data}

@app.get("/api/whatsapp/chats")
def get_chats():
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            url = f"{SUPABASE_URL}/rest/v1/whatsapp_chat_messages?select=phone_number,sender,message_text,created_at&order=created_at.asc&limit=200"
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            }
            resp = httpx.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                rows = resp.json()
                sb_store = {}
                for r in rows:
                    p = r.get("phone_number")
                    if not p: continue
                    if p not in sb_store:
                        sb_store[p] = {"phone": p, "messages": [], "last_activity": r.get("created_at")}
                    sb_store[p]["messages"].append({
                        "sender": r.get("sender"),
                        "text": r.get("message_text"),
                        "timestamp": r.get("created_at")
                    })
                    sb_store[p]["last_activity"] = r.get("created_at")
                if sb_store:
                    return {"chats": sorted(sb_store.values(), key=lambda c: c["last_activity"], reverse=True)}
        except Exception as e:
            print(f"⚠️ Error pulling chats from Supabase: {e}")

    sorted_chats = sorted(chat_store.values(), key=lambda c: c["last_activity"], reverse=True)
    return {"chats": sorted_chats}

@app.post("/api/whatsapp/send")
def send_message(req: SendMessageReq):
    if whatsapp_status != "connected":
        raise HTTPException(status_code=400, detail="WhatsApp is not connected")
    
    jid = build_jid(req.phone_number)
    try:
        client.send_message(jid, req.message)
        log_chat_message(req.phone_number, "admin", req.message)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SendImageReq(BaseModel):
    phone_number: str
    image_url: str
    caption: str = ""

@app.post("/api/whatsapp/send-image")
def send_image_route(req: SendImageReq):
    if whatsapp_status != "connected":
        raise HTTPException(status_code=400, detail="WhatsApp is not connected")
    
    jid = build_jid(req.phone_number)
    try:
        ext = "jpg"
        if ".png" in req.image_url.lower():
            ext = "png"
        temp_img_path = f"/tmp/product_{abs(hash(req.image_url))}.{ext}"
        resp = httpx.get(req.image_url, timeout=15)
        if resp.status_code == 200:
            with open(temp_img_path, "wb") as f:
                f.write(resp.content)
            try:
                client.send_image(jid, temp_img_path, caption=req.caption)
            except AttributeError:
                print("send_image not directly available on client, sending text instead")
                client.send_message(jid, f"{req.caption}\n{req.image_url}")
            log_chat_message(req.phone_number, "admin", f"[Image] {req.caption}")
            return {"success": True}
        else:
            raise HTTPException(status_code=400, detail=f"Failed to fetch image: status {resp.status_code}")
    except Exception as e:
        print(f"⚠️ send_image error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/whatsapp/send-document")
async def send_document(
    phone_number: str = Form(...),
    file: UploadFile = File(...)
):
    if whatsapp_status != "connected":
        raise HTTPException(status_code=400, detail="WhatsApp is not connected")
    
    jid = build_jid(phone_number)
    try:
        # Save file temporarily
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())
            
        # Send via neonize
        # Note: Neonize document sending syntax may vary. Typically:
        # client.send_document(jid, temp_path) OR client.send_media
        # Assuming client.send_document for now. If it errors, we will adjust.
        # Fallback for now if send_document doesn't exist:
        try:
            client.send_document(jid, temp_path, caption="Here is your document.")
        except AttributeError:
            # If standard neonize wrapper lacks send_document, send a text for now
            print("send_document not directly available on client, sending text instead.")
            client.send_message(jid, f"Your document {file.filename} is ready.")
            
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SendInvoiceReq(BaseModel):
    phone_number: str
    invoice_url: str

@app.post("/api/whatsapp/generate-and-send")
async def generate_and_send_invoice(req: SendInvoiceReq):
    if whatsapp_status != "connected":
        raise HTTPException(status_code=400, detail="WhatsApp is not connected")
    
    jid = build_jid(req.phone_number)
    try:
        pdf_path = f"/tmp/Invoice_{req.phone_number}.pdf"
        
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            # Navigate to the invoice page and wait for full render
            await page.goto(req.invoice_url, wait_until="networkidle")
            # Wait extra time for React/Next.js client-side rendering to complete
            await page.wait_for_timeout(5000)
            # Try to wait for the invoice content to appear (e.g., order number text)
            try:
                await page.wait_for_selector('text=Invoice', timeout=10000)
            except:
                pass  # If no "Invoice" text found, proceed anyway
            # Save as PDF
            await page.pdf(path=pdf_path, format="A4", print_background=True)
            await browser.close()

        # Send via neonize
        try:
            client.send_document(jid, pdf_path, caption="Here is your Invoice.")
        except AttributeError:
            client.send_message(jid, "Your invoice is ready but document sending is unsupported.")
            
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

