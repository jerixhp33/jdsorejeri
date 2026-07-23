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

interface NewArrivalEmailProps {
  customerName: string;
  productName: string;
  productUrl: string;
}

export const NewArrivalEmail = ({
  customerName,
  productName,
  productUrl,
}: NewArrivalEmailProps) => {
  const previewText = `JD Store Exclusive: ${productName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-[#000000] my-auto mx-auto font-sans">
          <Container className="bg-[#111111] border border-solid border-[#333333] rounded-xl my-[40px] mx-auto overflow-hidden max-w-[600px]">
            
            {/* Header */}
            <Section className="text-center p-[40px] border-b border-solid border-[#222222]">
              <Heading className="text-white text-[28px] m-0 tracking-[2px] font-bold">
                NEW ARRIVAL
              </Heading>
              <Text className="text-white text-[16px] m-0 mt-[10px] opacity-80">
                JD Store Exclusive
              </Text>
            </Section>

            {/* Content */}
            <Section className="text-center p-[40px] px-[30px]">
              <Text className="text-white text-[18px] m-0 mb-[20px] leading-[1.6]">
                Hi {customerName},<br />
                We just added a stunning new piece to our collection:
              </Text>
              
              <Heading className="text-white text-[24px] m-0 mb-[30px] font-bold">
                {productName}
              </Heading>
              
              <Section className="text-center">
                <Link
                  href={productUrl}
                  className="bg-white text-black px-[36px] py-[16px] rounded text-[14px] font-bold tracking-[1.5px] uppercase no-underline inline-block"
                >
                  Shop Now
                </Link>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="text-center p-[40px] bg-[#0A0A0A] border-t border-solid border-[#222222]">
              <Text className="text-[#666666] text-[11px] leading-[1.5] m-0 mb-[15px]">
                You are receiving this email because you opted into New Arrivals notifications at JD Store.<br/>
                We promise to only send you the good stuff.
              </Text>
              <Text className="text-[#444444] text-[11px] m-0">
                &copy; {new Date().getFullYear()} JD Store. All rights reserved.<br/>
                Tamil Nadu, India
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default NewArrivalEmail;
