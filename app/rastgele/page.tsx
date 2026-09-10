import RastgeleYonlendir from "@/components/RastgeleYonlendir";
import { getSohbetSluglari } from "@/lib/content";

// Statik export edilir; yönlendirme client-side yapılır (bkz. RastgeleYonlendir).
export default async function Rastgele() {
  return <RastgeleYonlendir sluglar={await getSohbetSluglari()} />;
}
