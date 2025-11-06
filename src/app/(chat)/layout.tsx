import { PetSelectionProvider } from "@/contexts/PetSelectionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ToastProvider";
import { ServiceWorkerUpdater } from "@/components/ServiceWorkerUpdater";

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <PetSelectionProvider>
        {children}
        <ToastProvider />
        <ServiceWorkerUpdater />
      </PetSelectionProvider>
    </AuthProvider>
  );
}
