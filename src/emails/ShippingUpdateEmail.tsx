import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface ShippingUpdateEmailProps {
  customerName: string;
  orderNumber: string;
  status: 'packed' | 'out_for_delivery' | 'shipped';
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export const ShippingUpdateEmail = ({
  customerName,
  orderNumber,
  status,
  courierName,
  trackingNumber,
  trackingUrl,
}: ShippingUpdateEmailProps) => {
  const statusText = status === 'packed' ? 'Packed' : status === 'out_for_delivery' ? 'Out for Delivery' : 'Shipped';
  const previewText = `Your JD Store order #${orderNumber} is ${statusText}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-[#f5f5f5] my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[40px] max-w-[600px]">
            <Section className="text-center mt-[10px]">
              <Text className="text-black text-[24px] font-bold tracking-[0.3em] m-0">JD STORE</Text>
            </Section>
            
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Order {statusText}
            </Heading>
            
            <Text className="text-black text-[14px] leading-[24px]">
              Hi {customerName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Great news! Your order <strong>#{orderNumber}</strong> is now <strong>{statusText}</strong>.
            </Text>

            {(courierName || trackingNumber) && (
              <Section className="bg-[#f9f9f9] border border-solid border-[#eaeaea] rounded p-[20px] my-[24px]">
                <Text className="text-[#666666] text-[12px] uppercase tracking-wider font-bold mb-4 m-0">Shipping Details</Text>
                
                {courierName && (
                  <Text className="text-[14px] text-black m-0 mb-2">
                    <strong>Courier:</strong> {courierName}
                  </Text>
                )}
                
                {trackingNumber && (
                  <Text className="text-[14px] text-black m-0 mb-4">
                    <strong>Tracking AWB:</strong> <code className="bg-[#eaeaea] px-2 py-1 rounded font-mono text-[14px]">{trackingNumber}</code>
                  </Text>
                )}
                
                {trackingUrl && (
                  <Section className="text-center mt-[20px]">
                    <Link
                      href={trackingUrl}
                      className="bg-black text-white px-6 py-3 rounded text-[14px] font-semibold tracking-wide no-underline inline-block"
                    >
                      Track Package
                    </Link>
                  </Section>
                )}
              </Section>
            )}

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            
            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              If you have any questions, reply to this email or contact us via WhatsApp.<br/>
              © {new Date().getFullYear()} JD Store. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ShippingUpdateEmail;
