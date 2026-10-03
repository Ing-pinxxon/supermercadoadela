import { MarcoCatalogo } from "@/components/catalogo/marco";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MarcoCatalogo>{children}</MarcoCatalogo>;
}
