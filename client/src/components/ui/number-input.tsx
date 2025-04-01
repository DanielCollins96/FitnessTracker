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
  allowDecimal?: boolean;
  precision?: number;
}

export default function NumberInput({
  value,
  onChange,
  min = 0,
  max = 1000,
  step = 5,
  allowDecimal = false,
  precision = 2
}: NumberInputProps) {
  // Round the value to the specified precision
  const roundToDecimal = (num: number): number => {
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  };
  
  const displayValue = allowDecimal 
    ? value % 1 === 0 ? value.toFixed(0) : value.toFixed(precision)
    : value;

  const handleIncrement = () => {
    const newValue = roundToDecimal(value + step);
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = roundToDecimal(value - step);
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Use parseFloat instead of parseInt for decimal support
    const inputValue = e.target.value;
    
    if (inputValue === '') {
      onChange(0);
      return;
    }
    
    const parseFunc = allowDecimal ? parseFloat : parseInt;
    const newValue = parseFunc(inputValue);
    
    if (!isNaN(newValue)) {
      const roundedValue = allowDecimal ? roundToDecimal(newValue) : newValue;
      if ((min === undefined || roundedValue >= min) && (max === undefined || roundedValue <= max)) {
        onChange(roundedValue);
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
        value={displayValue}
        onChange={handleInputChange}
        className="rounded-none text-center border-x-0"
        min={min}
        max={max}
        step={allowDecimal ? 0.01 : step}
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
