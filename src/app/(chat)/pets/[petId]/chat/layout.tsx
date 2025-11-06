export async function generateStaticParams() {
  // Return a dummy petId to satisfy the build process for static export.
  // In a real application, you would fetch all possible petIds from your data source.
  return [{ petId: 'dummy-pet-id' }];
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
