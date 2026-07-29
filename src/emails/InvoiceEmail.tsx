import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Hr,
  Button
} from '@react-email/components';
import * as React from 'react';

interface InvoiceEmailProps {
  orderId: string;
  orderNumber: string;
  customerName: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    image?: string;
    size?: string;
  }[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  shippingAddress: string;
  storeUrl: string;
}

export const InvoiceEmail = ({
  orderId,
  orderNumber,
  customerName,
  date,
  items,
  subtotal,
  deliveryCharge,
  discount,
  total,
  shippingAddress,
  storeUrl
}: InvoiceEmailProps) => {
  const invoiceUrl = `${storeUrl}/dashboard/orders/${orderId}/invoice`;

  return (
    <Html>
      <Head />
      <Preview>Your Invoice for Order #{orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>JD STORE</Text>
            <Heading style={title}>Order Invoice</Heading>
            <Text style={subtitle}>Thank you for your purchase!</Text>
          </Section>

          <Section style={detailsSection}>
            <Row>
              <Column>
                <Text style={label}>Order Number:</Text>
                <Text style={value}>#{orderNumber}</Text>
              </Column>
              <Column align="right">
                <Text style={label}>Date:</Text>
                <Text style={value}>{new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          <Section style={itemsSection}>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                {item.image && (
                  <Column style={{ width: '60px' }}>
                    <Img src={item.image} width="50" height="50" style={itemImage} alt={item.name} />
                  </Column>
                )}
                <Column>
                  <Text style={itemName}>{item.name}</Text>
                  <Text style={itemMeta}>Qty: {item.quantity} {item.size && `• Size: ${item.size}`}</Text>
                </Column>
                <Column align="right">
                  <Text style={itemPrice}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={divider} />

          <Section style={totalsSection}>
            <Row style={totalRow}>
              <Column><Text style={totalsLabel}>Subtotal</Text></Column>
              <Column align="right"><Text style={totalsValue}>₹{subtotal.toLocaleString('en-IN')}</Text></Column>
            </Row>
            {discount > 0 && (
              <Row style={totalRow}>
                <Column><Text style={totalsLabel}>Discount</Text></Column>
                <Column align="right"><Text style={{ ...totalsValue, color: '#16a34a' }}>-₹{discount.toLocaleString('en-IN')}</Text></Column>
              </Row>
            )}
            <Row style={totalRow}>
              <Column><Text style={totalsLabel}>Delivery</Text></Column>
              <Column align="right"><Text style={totalsValue}>{deliveryCharge > 0 ? `₹${deliveryCharge.toLocaleString('en-IN')}` : 'Free'}</Text></Column>
            </Row>
            <Hr style={totalsDivider} />
            <Row style={totalRow}>
              <Column><Text style={grandTotalLabel}>Total</Text></Column>
              <Column align="right"><Text style={grandTotalValue}>₹{total.toLocaleString('en-IN')}</Text></Column>
            </Row>
          </Section>

          <Section style={shippingSection}>
            <Text style={label}>Shipping To:</Text>
            <Text style={shippingAddressText}>{customerName}</Text>
            <Text style={shippingAddressText}>{shippingAddress}</Text>
          </Section>

          <Section style={actionSection}>
            <Button href={invoiceUrl} style={button}>
              Download PDF Invoice
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              If you have any questions, reply to this email or contact us at support@jdstore.com
            </Text>
            <Link href={storeUrl} style={footerLink}>Return to JD Store</Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InvoiceEmail;

const main = {
  backgroundColor: '#f3f4f6',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '40px auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#000000',
  padding: '40px 40px',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  letterSpacing: '0.1em',
  margin: '0 0 20px',
};

const title = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const subtitle = {
  color: '#9ca3af',
  fontSize: '16px',
  margin: '0',
};

const detailsSection = {
  padding: '30px 40px 10px',
};

const label = {
  color: '#6b7280',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  fontWeight: 'bold',
  letterSpacing: '0.05em',
  margin: '0 0 4px',
};

const value = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 40px',
};

const itemsSection = {
  padding: '10px 40px',
};

const itemRow = {
  marginBottom: '20px',
};

const itemImage = {
  borderRadius: '6px',
  objectFit: 'cover' as const,
};

const itemName = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 4px',
};

const itemMeta = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
};

const itemPrice = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0',
};

const totalsSection = {
  padding: '10px 40px 20px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  margin: '0 40px',
};

const totalRow = {
  margin: '8px 0',
};

const totalsLabel = {
  color: '#4b5563',
  fontSize: '14px',
  margin: '0',
};

const totalsValue = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const totalsDivider = {
  borderColor: '#e5e7eb',
  margin: '12px 0',
};

const grandTotalLabel = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const grandTotalValue = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const shippingSection = {
  padding: '20px 40px',
};

const shippingAddressText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '4px 0 0',
};

const actionSection = {
  padding: '20px 40px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 24px',
  width: '100%',
};

const footer = {
  backgroundColor: '#f9fafb',
  padding: '30px 40px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 12px',
};

const footerLink = {
  color: '#000000',
  fontSize: '13px',
  fontWeight: 'bold',
  textDecoration: 'underline',
};
