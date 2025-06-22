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

interface BouquetItemWithName extends BouquetItem {
  flowerName: string;
}

export default function NewBouquet() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedFlowers, setSelectedFlowers] = useState<BouquetItemWithName[]>([]);
  const [selectedFlower, setSelectedFlower] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(1);

  // Query for warehouse flowers
  const { data: flowers = [] } = useQuery<Warehouse[]>({
    queryKey: ['/api/flowers'],
  });

  // Create bouquet mutation
  const createBouquetMutation = useMutation({
    mutationFn: async (data: { bouquet: { description: string; photo?: string | null }, items: BouquetItem[] }) => {
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

  const addFlower = () => {
    if (selectedFlower && selectedAmount > 0) {
      const flower = flowers.find(f => f.flower === selectedFlower);
      if (flower && flower.amount >= selectedAmount) {
        const newItem: BouquetItemWithName = {
          id: Date.now(), // Temporary ID for UI
          bouquetId: 0, // Will be set by backend
          flower: selectedFlower,
          flowerName: selectedFlower,
          amount: selectedAmount,
        };
        setSelectedFlowers([...selectedFlowers, newItem]);
        setSelectedFlower("");
        setSelectedAmount(1);
      } else {
        toast({
          title: "Ошибка",
          description: "Недостаточно цветов на складе",
          variant: "destructive",
        });
      }
    }
  };

  const removeFlower = (index: number) => {
    setSelectedFlowers(selectedFlowers.filter((_, i) => i !== index));
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

    if (selectedFlowers.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы один цветок",
        variant: "destructive",
      });
      return;
    }

    const bouquetData = {
      bouquet: {
        description: description.trim(),
        photo: photo,
      },
      items: selectedFlowers.map(({ flower, amount }) => ({ flower, amount })),
    };

    createBouquetMutation.mutate(bouquetData);
  };

  const availableFlowers = flowers.filter(flower => flower.amount > 0);

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
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="flower">Цветок</Label>
                <select
                  id="flower"
                  value={selectedFlower}
                  onChange={(e) => setSelectedFlower(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Выберите цветок</option>
                  {availableFlowers.map((flower) => (
                    <option key={flower.id} value={flower.flower}>
                      {flower.flower} (доступно: {flower.amount})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <Label htmlFor="amount">Количество</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={selectedAmount}
                  onChange={(e) => setSelectedAmount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addFlower}
                  disabled={!selectedFlower || selectedAmount <= 0}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Добавить
                </Button>
              </div>
            </div>

            {selectedFlowers.length > 0 && (
              <div className="space-y-2">
                <Label>Выбранные цветы:</Label>
                {selectedFlowers.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <span>{item.flowerName} - {item.amount} шт.</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFlower(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
            disabled={createBouquetMutation.isPending || selectedFlowers.length === 0}
          >
            {createBouquetMutation.isPending ? "Создание..." : "Создать букет"}
          </Button>
        </div>
      </form>
    </section>
  );
} 