"use client";

import { PetCard } from "@/components/PetCard";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/hooks/usePets";
import type { Pet } from "@/lib/types";
import { PetAddForm } from "@/components/PetAddForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PawPrintIcon, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { toast } from "sonner";
import { usePetSelection } from "@/contexts/PetSelectionContext";
export default function PetsPage() {
  const { user, loading: authLoading } = useAuth();
  const { pets, loading: petsLoading, deletePet } = usePets();
  const {  } = usePetSelection();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [petToEdit, setPetToEdit] = useState<Pet | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [petToDeleteId, setPetToDeleteId] = useState<string | null>(null);
  const [openWeightFormForPetId, setOpenWeightFormForPetId] = useState<
    string | null
  >(null);

  const isLoading = authLoading || petsLoading;

  const filteredPets = pets.filter((pet) => {
    const matchesTab = selectedTab === "all" || pet.gender === selectedTab;
    const matchesSearch =
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.breed && pet.breed.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleEditPet = (pet: Pet) => {
    setPetToEdit(pet);
    setIsFormOpen(true);
  };

  const handleDeletePet = (petId: string) => {
    setPetToDeleteId(petId);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeletePet = async () => {
    if (petToDeleteId) {
      await deletePet(petToDeleteId);
      toast.success("ペットを削除しました！");
      setPetToDeleteId(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">ロード中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">このページを表示するにはログインが必要です。</p>
        <Link href="/login">
          <Button>ログインページへ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-8">
        {/* Removed PetAddForm from here */}
      </header>

      <div className="flex justify-end mb-4">
        {" "}
        {/* New div for PetAddForm */}
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="ペットを検索..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <PetAddForm />
        </div>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full mb-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">すべて</TabsTrigger>
          <TabsTrigger value="male">男の子</TabsTrigger>
          <TabsTrigger value="female">女の子</TabsTrigger>
          <TabsTrigger value="other">その他</TabsTrigger>
        </TabsList>
      </Tabs>

      {pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <PawPrintIcon className="h-16 w-16 mb-4 text-gray-400" />
          <p className="text-lg font-semibold mb-2">
            まだペットが登録されていません。
          </p>
          <p className="text-md">
            新しいペットを登録して、ケアを始めましょう！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              user={user}
              handleEditPet={handleEditPet}
              handleDeletePet={handleDeletePet}
              openWeightFormForPetId={openWeightFormForPetId}
              setOpenWeightFormForPetId={setOpenWeightFormForPetId}
            />
          ))}
        </div>
      )}

      {isFormOpen && (
        <PetAddForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          petToEdit={petToEdit}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="ペットの削除確認"
        message="本当にこのペットを削除しますか？この操作は元に戻せません。関連するタスクやログも全て論理削除されます。"
        onConfirm={handleConfirmDeletePet}
        confirmButtonText="削除する"
        cancelButtonText="キャンセル"
        isDestructive={true}
      />
    </div>
  );
}
