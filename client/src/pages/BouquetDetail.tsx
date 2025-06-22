import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bouquet, BouquetItem } from "@shared/schema";
import { useLocation } from "wouter";
import { ArrowLeft, ShoppingCart, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function BouquetDetail() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Extract bouquet ID from URL
  const bouquetId = location.split('/').pop();
  
  // Query for bouquet details
  const { data: bouquet, isLoading: bouquetLoading } = useQuery<Bouquet>({
    queryKey: ['/api/bouquets', bouquetId],
    queryFn: async () => {
      const response = await fetch(`/api/bouquets/${bouquetId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bouquet');
      }
      return response.json();
    },
    enabled: !!bouquetId,
  });

  // Query for bouquet items
  const { data: items = [], isLoading: itemsLoading } = useQuery<BouquetItem[]>({
    queryKey: ['/api/bouquets', bouquetId, 'items'],
    queryFn: async () => {
      const response = await fetch(`/api/bouquets/${bouquetId}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch bouquet items');
      }
      return response.json();
    },
    enabled: !!bouquetId,
  });

  const handleSellBouquet = async () => {
    if (confirm('Вы уверены, что хотите продать этот букет?')) {
      try {
        const response = await fetch(`/api/bouquets/${bouquetId}/sell`, {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error('Failed to sell bouquet');
        }
        toast({
          title: "Успешно",
          description: "Букет продан",
        });
        navigate("/bouquets");
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось продать букет",
          variant: "destructive",
        });
      }
    }
  };

  const handleDisassembleBouquet = async () => {
    if (confirm('Вы уверены, что хотите разобрать этот букет? Цветы будут возвращены на склад.')) {
      try {
        const response = await fetch(`/api/bouquets/${bouquetId}/disassemble`, {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error('Failed to disassemble bouquet');
        }
        toast({
          title: "Успешно",
          description: "Букет разобран, цветы возвращены на склад",
        });
        navigate("/bouquets");
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось разобрать букет",
          variant: "destructive",
        });
      }
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

  if (bouquetLoading || itemsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center">Загрузка букета...</div>
      </div>
    );
  }

  if (!bouquet) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center text-red-600">Букет не найден</div>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/bouquets")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к букетам
        </Button>
        <h1 className="text-2xl font-bold">Букет #{bouquet.id}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bouquet Information */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о букете</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Описание</Label>
              <p className="mt-1 text-gray-900">{bouquet.description}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Дата создания</Label>
              <p className="mt-1 text-gray-900">{formatDate(bouquet.dateTime)}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSellBouquet}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <ShoppingCart className="h-4 w-4" />
                Продать
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDisassembleBouquet}
                className="flex items-center gap-2 text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <Scissors className="h-4 w-4" />
                Разобрать
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bouquet Photo */}
        {bouquet.photo && (
          <Card>
            <CardHeader>
              <CardTitle>Фото букета</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={bouquet.photo}
                alt="Фото букета"
                className="w-full h-64 object-cover rounded-lg border"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bouquet Items */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Цветы в букете</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-4">В букете нет цветов</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <span className="font-medium">{item.flower}</span>
                  <Badge variant="secondary">{item.amount} шт.</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
} 