import { PetSelectionProvider } from "@/contexts/PetSelectionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ToastProvider";

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
      </PetSelectionProvider>
    </AuthProvider>
  );
}
