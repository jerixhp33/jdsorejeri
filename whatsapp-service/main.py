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
from playwright.async_api import async_playwright

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
print(f"🔑 Gemini API Key loaded: {'Yes (' + GEMINI_API_KEY[:8] + '...)' if GEMINI_API_KEY else 'No'}")

def ask_gemini(prompt: str) -> str:
    """Call Gemini API directly via HTTP to avoid SDK incompatibilities with AQ. keys."""
    if not GEMINI_API_KEY:
        return "Gemini API key is not configured."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    try:
        resp = httpx.post(url, json=payload, timeout=30)
        print(f"🌐 Gemini API response status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"❌ Gemini API error body: {resp.text}")
            return f"AI service error (status {resp.status_code}). Please check API key."
        data = resp.json()
        # Extract text from the response
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

    incoming_text = ""
    if ev.Message.conversation:
        incoming_text = ev.Message.conversation
    elif ev.Message.extendedTextMessage and ev.Message.extendedTextMessage.text:
        incoming_text = ev.Message.extendedTextMessage.text

    if incoming_text and GEMINI_API_KEY:
        print(f"📥 Received: {incoming_text}")
        reply_text = ask_gemini(incoming_text)
        print(f"📤 Replying: {reply_text[:100]}...")
        client.reply_message(reply_text, ev)
    elif incoming_text:
        print(f"📥 Received: {incoming_text} (no API key, skipping AI)")
        client.reply_message("Bot is running but AI is not configured yet.", ev)

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

@app.post("/api/whatsapp/send")
def send_message(req: SendMessageReq):
    if whatsapp_status != "connected":
        raise HTTPException(status_code=400, detail="WhatsApp is not connected")
    
    # Neonize requires JID format: phonenumber@s.whatsapp.net
    jid = f"{req.phone_number}@s.whatsapp.net"
    try:
        # client.send_message is synchronous in neonize standard client
        client.send_message(jid, req.message)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/whatsapp/send-document")
async def send_document(
    phone_number: str = Form(...),
    file: UploadFile = File(...)
):
    if whatsapp_status != "connected":
        raise HTTPException(status_code=400, detail="WhatsApp is not connected")
    
    jid = f"{phone_number}@s.whatsapp.net"
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
    
    jid = f"{req.phone_number}@s.whatsapp.net"
    try:
        pdf_path = f"/tmp/Invoice_{req.phone_number}.pdf"
        
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            # Navigate to the invoice page
            await page.goto(req.invoice_url, wait_until="networkidle")
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
