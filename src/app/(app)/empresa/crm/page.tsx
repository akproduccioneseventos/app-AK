import { redirect } from 'next/navigation';

export default function LegacyPredictiveCrmPage() {
  redirect('/contabilidad/crm?view=guest');
}
