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
  Tailwind,
  Hr,
  Column,
  Row,
} from '@react-email/components';
import * as React from 'react';

interface AbandonedCartEmailProps {
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  checkoutUrl: string;
}

export const AbandonedCartEmail = ({
  customerName,
  items,
  checkoutUrl,
}: AbandonedCartEmailProps) => {
  const previewText = `You left something amazing in your cart at JD Store`;

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
              Did you forget something?
            </Heading>
            
            <Text className="text-black text-[14px] leading-[24px]">
              Hi {customerName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              We noticed you left some amazing items in your cart. 
              They are still waiting for you, but we can't guarantee they will stay in stock forever!
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Section>
              {items.map((item, index) => (
                <Row key={index} className="mb-4">
                  {item.image && (
                    <Column className="w-16">
                      <Img src={item.image} width="50" height="50" className="rounded object-cover bg-[#f5f5f5]" />
                    </Column>
                  )}
                  <Column className="w-full">
                    <Text className="text-[14px] text-black m-0 font-medium">{item.name}</Text>
                    <Text className="text-[12px] text-[#666666] m-0 mt-1">Qty: {item.quantity}</Text>
                  </Column>
                  <Column className="w-auto text-right min-w-[80px]">
                    <Text className="text-[14px] text-black m-0">₹{item.price * item.quantity}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Section className="text-center mt-[40px] mb-[20px]">
              <Link
                href={checkoutUrl}
                className="bg-black text-white px-6 py-3 rounded text-[14px] font-semibold tracking-wide no-underline inline-block"
              >
                Complete Your Order
              </Link>
            </Section>

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

export default AbandonedCartEmail;
