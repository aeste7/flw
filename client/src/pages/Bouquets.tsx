import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bouquet } from "@shared/schema";
import { useLocation } from "wouter";
import { Plus, ShoppingCart, Scissors, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Bouquets() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query for bouquets
  const { data: bouquets = [], isLoading } = useQuery<Bouquet[]>({
    queryKey: ['/api/bouquets'],
  });

  // Sell bouquet mutation
  const sellBouquetMutation = useMutation({
    mutationFn: async (bouquetId: number) => {
      const response = await fetch(`/api/bouquets/${bouquetId}/sell`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to sell bouquet');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bouquets'] });
      toast({
        title: "Успешно",
        description: "Букет продан",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось продать букет",
        variant: "destructive",
      });
    },
  });

  // Disassemble bouquet mutation
  const disassembleBouquetMutation = useMutation({
    mutationFn: async (bouquetId: number) => {
      const response = await fetch(`/api/bouquets/${bouquetId}/disassemble`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to disassemble bouquet');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bouquets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      toast({
        title: "Успешно",
        description: "Букет разобран, цветы возвращены на склад",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось разобрать букет",
        variant: "destructive",
      });
    },
  });

  const handleSellBouquet = (bouquetId: number) => {
    if (confirm('Вы уверены, что хотите продать этот букет?')) {
      sellBouquetMutation.mutate(bouquetId);
    }
  };

  const handleDisassembleBouquet = (bouquetId: number) => {
    if (confirm('Вы уверены, что хотите разобрать этот букет? Цветы будут возвращены на склад.')) {
      disassembleBouquetMutation.mutate(bouquetId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center">Загрузка букетов...</div>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        
        <Button
          onClick={() => navigate("/new-bouquet")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Добавить букет
        </Button>
      </div>

      {bouquets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg mb-2">Нет букетов</p>
              <p className="text-sm">Создайте первый букет из цветов со склада</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bouquets.map((bouquet) => (
            <Card key={bouquet.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        Букет #{bouquet.id}
                      </h3>
                      <Badge variant="secondary">
                        {formatDate(bouquet.dateTime)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-4">{bouquet.description}</p>
                    
                    {bouquet.photo && (
                      <div className="mb-4">
                        <img 
                          src={bouquet.photo} 
                          alt="Фото букета"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/bouquet/${bouquet.id}`)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Просмотр
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSellBouquet(bouquet.id)}
                      disabled={sellBouquetMutation.isPending}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Продать
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisassembleBouquet(bouquet.id)}
                      disabled={disassembleBouquetMutation.isPending}
                      className="flex items-center gap-2 text-orange-600 border-orange-600 hover:bg-orange-50"
                    >
                      <Scissors className="h-4 w-4" />
                      Разобрать
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
} 