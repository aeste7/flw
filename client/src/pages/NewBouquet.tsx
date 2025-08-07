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
import { resizeImage, fileToBase64, isHeicFile } from "@/lib/imageUtils";

// Dynamic import for heic2any to handle potential module resolution issues
let heic2any: any = null;
try {
  heic2any = require("heic2any");
} catch (error) {
  console.warn("heic2any not available, HEIC conversion will be disabled");
}

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
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessingPhoto(true);
      try {
        let processedFile = file;
        
        // Check if the file is a HEIC/HEIF file
        if (isHeicFile(file) && heic2any) {
          try {
            // Convert HEIC to JPEG using heic2any
            const convertedBlob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.8
            });
            
            // Handle both single blob and array of blobs
            const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            
            // Create a new File object with the converted data
            processedFile = new File([blobToUse], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
              type: 'image/jpeg'
            });
          } catch (conversionError) {
            console.warn('HEIC conversion failed:', conversionError);
            toast({
              title: "Предупреждение",
              description: "HEIC файл не может быть конвертирован. Попробуйте JPG или PNG формат.",
              variant: "destructive",
            });
            return;
          }
        } else if (isHeicFile(file)) {
          // HEIC file but heic2any is not available
          toast({
            title: "Ошибка",
            description: "HEIC файлы не поддерживаются. Пожалуйста, используйте JPG или PNG формат.",
            variant: "destructive",
          });
          return;
        }
        
        // Resize image to maximum 600px
        try {
          processedFile = await resizeImage(processedFile, 600, 600);
        } catch (resizeError) {
          console.warn('Image resize failed:', resizeError);
          // Continue with original file if resize fails
        }
        
        // Convert to base64
        const base64Data = await fileToBase64(processedFile);
        setPhoto(base64Data);
        setIsProcessingPhoto(false);
        
      } catch (error) {
        console.error('Error processing photo:', error);
        setIsProcessingPhoto(false);
        toast({
          title: "Ошибка",
          description: "Не удалось обработать фотографию. Попробуйте другой формат.",
          variant: "destructive",
        });
      }
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

    // Use description if provided, otherwise it will be auto-generated on the server
    const finalDescription = description.trim() || "";

    const bouquetData = {
      bouquet: {
        description: finalDescription,
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
              <Label htmlFor="description">Описание букета (необязательно)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите букет или оставьте пустым для автоматической генерации..."
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
                  accept="image/*,.heic,.heif"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo')?.click()}
                    className="flex items-center gap-2"
                    disabled={isProcessingPhoto}
                  >
                    <Upload className="h-4 w-4" />
                    {isProcessingPhoto ? "Обработка..." : "Загрузить фото"}
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
                <p className="text-sm text-muted-foreground mt-2">
                  Поддерживаемые форматы: JPG, PNG, GIF{heic2any ? ', HEIC (автоматическая конвертация в JPG)' : ''}. 
                  Фотографии автоматически уменьшаются до 600px для оптимизации.
                </p>
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