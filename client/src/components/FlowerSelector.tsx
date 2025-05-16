import { useState } from "react";
import { Warehouse } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MinusIcon, PlusIcon } from "lucide-react";

interface FlowerSelectorProps {
  flowers: Warehouse[] | undefined;
  selectedFlowers: Map<number, number>;
  onSelectFlower: (flowerId: number, amount: number) => void;
  isLoading?: boolean;
  projectedInventory?: Map<number, number>; // Add this prop
}

export default function FlowerSelector({
  flowers = [], // Provide a default empty array
  selectedFlowers,
  onSelectFlower,
  isLoading = false,
  projectedInventory, // Add this prop
}: FlowerSelectorProps) {
  
  const updateFlowerAmount = (flowerId: number, change: number) => {
    const flower = flowers.find(f => f.id === flowerId);
    if (!flower) return;
    
    const currentAmount = selectedFlowers.get(flowerId) || 0;
    const newAmount = Math.max(0, currentAmount + change);
    
    // Don't limit by flower.amount - let the projected inventory handle this
    onSelectFlower(flowerId, newAmount);
  };
  
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md bg-gray-50">
      {isLoading ? (
        <div className="p-4 text-center text-gray-500">
          Загрузка цветов...
        </div>
      ) : !Array.isArray(flowers) || flowers.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          Нет доступных цветов
        </div>
      ) : (
        flowers.map((flower) => {
          const selectedAmount = selectedFlowers.get(flower.id) || 0;
          const projectedAmount = projectedInventory?.get(flower.id);
          const showProjected = projectedInventory && projectedAmount !== undefined && projectedAmount !== flower.amount;
          
          return (
            <div 
              key={flower.id}
              className="flex justify-between items-center p-2 bg-white rounded border border-gray-200"
            >
              <div className="flex items-center">
                <span className="font-medium">{flower.flower}</span>
                <span className="ml-2 text-sm text-gray-500">
                  Доступно: {flower.amount}
                  {showProjected && (
                    <span className={`ml-2 ${projectedAmount < 0 ? 'text-red-500 font-semibold' : 'text-green-500'}`}>
                      → {projectedAmount} {projectedAmount < 0 && '(недостаточно!)'}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={() => updateFlowerAmount(flower.id, -1)}
                  disabled={!selectedFlowers.get(flower.id)}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  className="w-12 text-center border-0 p-1"
                  value={selectedFlowers.get(flower.id) || 0}
                  min={0}
                  readOnly
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={() => updateFlowerAmount(flower.id, 1)}
                  disabled={projectedAmount !== undefined && projectedAmount < 0}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
