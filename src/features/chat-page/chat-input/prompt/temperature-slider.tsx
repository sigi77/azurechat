"use client";
import React from "react";

interface TemperatureSliderProps {
    value: number;
    onChange: (val: number) => void;
}

// @ts-ignore
// @ts-ignore
export const TemperatureSlider: React.FC<TemperatureSliderProps> = ({
                                                                        value,
                                                                        onChange,
                                                                    }) => {
    return (
        <div className="flex items-center gap-2 w-[100px]">
            <span className="text-xs text-muted-foreground">❄️</span>
            <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full"
            />
            <span className="text-xs text-muted-foreground">🔥</span>
        </div>
    );
};
