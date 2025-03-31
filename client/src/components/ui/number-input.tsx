import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus } from "lucide-react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function NumberInput({
  value,
  onChange,
  min = 0,
  max = 1000,
  step = 5
}: NumberInputProps) {
  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue)) {
      if ((min === undefined || newValue >= min) && (max === undefined || newValue <= max)) {
        onChange(newValue);
      }
    }
  };

  return (
    <div className="flex">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 rounded-l-md rounded-r-none border-r-0"
        onClick={handleDecrement}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        className="rounded-none text-center border-x-0"
        min={min}
        max={max}
        step={step}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 rounded-r-md rounded-l-none border-l-0"
        onClick={handleIncrement}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
