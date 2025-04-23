import { useState } from "react";
import { Warehouse } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MinusIcon, PlusIcon } from "lucide-react";

interface FlowerSelectorProps {
  flowers: Warehouse[];
  selectedFlowers: Map<number, number>;
  onSelectFlower: (flowerId: number, amount: number) => void;
}

export default function FlowerSelector({ 
  flowers, 
  selectedFlowers, 
  onSelectFlower
}: FlowerSelectorProps) {
  
  const updateFlowerAmount = (flowerId: number, change: number) => {
    const flower = flowers.find(f => f.id === flowerId);
    if (!flower) return;
    
    const currentAmount = selectedFlowers.get(flowerId) || 0;
    const newAmount = Math.max(0, Math.min(flower.amount, currentAmount + change));
    
    onSelectFlower(flowerId, newAmount);
  };
  
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md bg-gray-50">
      {flowers.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No flowers available in inventory
        </div>
      ) : (
        flowers.map((flower) => (
          <div 
            key={flower.id}
            className="flex justify-between items-center p-2 bg-white rounded border border-gray-200"
          >
            <div className="flex items-center">
              <span className="font-medium">{flower.flower}</span>
              <span className="ml-2 text-sm text-gray-500">
                Available: {flower.amount}
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
                max={flower.amount}
                readOnly
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full"
                onClick={() => updateFlowerAmount(flower.id, 1)}
                disabled={selectedFlowers.get(flower.id) === flower.amount}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
