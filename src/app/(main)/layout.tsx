import { PetSelectionProvider } from "@/contexts/PetSelectionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { FooterNav } from "@/components/FooterNav";
import { ToastProvider } from "@/components/ToastProvider";
import { ServiceWorkerUpdater } from "@/components/ServiceWorkerUpdater";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <PetSelectionProvider>
        <Header />
        <main className="flex-grow pt-16 pb-16"> {/* Add padding-top for fixed header, padding-bottom for fixed footer */}
          {children}
        </main>
        <FooterNav />
        <ToastProvider />
        <ServiceWorkerUpdater />
      </PetSelectionProvider>
    </AuthProvider>
  );
}
