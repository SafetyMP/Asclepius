import { sourceCodeSchema } from '@/lib/site-metadata';
import ReferralReview from './referral-review/referral-review-case';
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sourceCodeSchema).replace(/</g, '\\u003c'),
        }}
      />
      <ReferralReview />
    </>
  );
}
