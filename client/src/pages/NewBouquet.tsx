import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Warehouse, BouquetItem } from "@shared/schema";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FlowerSelector from "@/components/FlowerSelector";

interface BouquetItemWithName extends BouquetItem {
  flowerName: string;
}

export default function NewBouquet() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedFlowers, setSelectedFlowers] = useState<Map<number, number>>(new Map());

  // Query for warehouse flowers
  const { data: flowers = [], isLoading } = useQuery<Warehouse[]>({
    queryKey: ['/api/flowers'],
  });

  // Create bouquet mutation
  const createBouquetMutation = useMutation({
    mutationFn: async (data: { bouquet: { description: string; photo?: string | null }, items: { flower: string; amount: number }[] }) => {
      const response = await fetch('/api/bouquets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create bouquet');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bouquets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      toast({
        title: "Успешно",
        description: "Букет создан",
      });
      navigate("/bouquets");
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать букет",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle flower selection using the same pattern as NewOrder
  const handleSelectFlower = (flowerId: number, amount: number) => {
    const newSelectedFlowers = new Map(selectedFlowers);
    
    if (amount === 0) {
      newSelectedFlowers.delete(flowerId);
    } else {
      newSelectedFlowers.set(flowerId, amount);
    }
    
    setSelectedFlowers(newSelectedFlowers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите описание букета",
        variant: "destructive",
      });
      return;
    }

    if (selectedFlowers.size === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы один цветок",
        variant: "destructive",
      });
      return;
    }

    // Convert selectedFlowers Map to items array
    const items = Array.from(selectedFlowers.entries()).map(([flowerId, amount]) => {
      const flower = flowers.find(f => f.id === flowerId);
      return {
        flower: flower?.flower || "",
        amount,
      };
    });

    const bouquetData = {
      bouquet: {
        description: description.trim(),
        photo: photo,
      },
      items,
    };

    createBouquetMutation.mutate(bouquetData);
  };

  return (
    <section className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/bouquets")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold">Создать букет</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Описание букета</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите букет..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="photo">Фото букета</Label>
              <div className="mt-1">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Загрузить фото
                  </Button>
                  {photo && (
                    <div className="relative">
                      <img
                        src={photo}
                        alt="Предварительный просмотр"
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPhoto(null)}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Цветы в букете</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="flowers" className="block text-sm font-medium text-gray-700 mb-1">
                Выберите цветы
              </Label>
              {isLoading ? (
                <div className="p-4 text-center">Загружаются цветы...</div>
              ) : (
                <FlowerSelector
                  flowers={flowers}
                  selectedFlowers={selectedFlowers}
                  onSelectFlower={handleSelectFlower}
                />
              )}
              {selectedFlowers.size === 0 && createBouquetMutation.isError && (
                <p className="text-sm text-red-500 mt-1">Пожалуйста, выберите цветы</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/bouquets")}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={createBouquetMutation.isPending || selectedFlowers.size === 0}
          >
            {createBouquetMutation.isPending ? "Создание..." : "Создать букет"}
          </Button>
        </div>
      </form>
    </section>
  );
} 