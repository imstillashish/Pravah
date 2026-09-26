import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export interface CargoFanItem {
  id: string;
  imgSrc: string;
  title: string;
  badge?: string;
  aboutProduct: string;
  extraInfo?: string;
}

interface CargoFanStackProps {
  items: CargoFanItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

const getFanPosition = (index: number, total: number) => {
  if (total <= 1) return { x: 0, y: -100, rotate: 0 };
  const centerIndex = (total - 1) / 2;
  const offset = index - centerIndex;

  const stepX = total <= 4 ? 170 : 120;
  const stepRotate = total <= 4 ? 10 : 7.5;

  const x = offset * stepX;
  const rotate = offset * stepRotate;
  const y = -100 + Math.abs(offset) * (total <= 4 ? 26 : 18);

  return { x, y, rotate };
};

const getStackStyle = (index: number, total: number) => {
  const centerIndex = (total - 1) / 2;
  const offset = index - centerIndex;
  const rotate = offset * 4.5;
  const zIndex = Math.round((total - Math.abs(offset)) * 10);
  return { rotate, zIndex };
};

export const CargoFanStack = ({
  items,
  selectedId,
  onSelect,
  className = "",
}: CargoFanStackProps) => {
  const [hovered, setHovered] = useState(false);
  const total = items.length;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>


      {/* Fan Deck Container */}
      <div
        className="relative flex justify-center items-end"
        style={{ height: 220, width: "100%", maxWidth: 900 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {items.map((item, i) => {
          const fan = getFanPosition(i, total);
          const stack = getStackStyle(i, total);
          const isSelected = selectedId === item.id;

          return (
            <motion.div
              key={item.id}
              initial={false}
              animate={
                hovered
                  ? { x: fan.x, y: fan.y, rotate: fan.rotate, scale: 1 }
                  : { x: 0, y: 0, rotate: stack.rotate, scale: 1 }
              }
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 28,
                delay: hovered ? i * 0.03 : (total - 1 - i) * 0.03,
              }}
              style={{
                zIndex: isSelected
                  ? 80
                  : hovered
                  ? (total - i + 1) * 10
                  : stack.zIndex,
              }}
              className="absolute bottom-2 cursor-pointer will-change-transform"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item.id);
              }}
              whileHover={
                hovered
                  ? {
                      scale: 1.1,
                      y: fan.y - 18,
                      zIndex: 95,
                    }
                  : {}
              }
            >
              {/* Card Surface */}
              <div
                className={`
                  relative w-40 sm:w-44 rounded-2xl border p-4 text-center shadow-xl
                  transition-all duration-200 backdrop-blur-xs
                  ${
                    isSelected
                      ? "border-forest-ink bg-linen-mist ring-2 ring-forest-ink/70 shadow-[0_0_22px_rgba(159,232,112,0.45)]"
                      : "border-pebble bg-paper hover:border-forest-ink/50 hover:shadow-2xl"
                  }
                `}
              >
                {/* Active check indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 size-5 rounded-full bg-forest-ink text-lime-voltage flex items-center justify-center shadow-xs"
                  >
                    <CheckCircle2 className="size-3.5 stroke-[3]" />
                  </motion.div>
                )}

                {/* Badge */}
                {item.badge && (
                  <span className="inline-block rounded-full bg-fog/90 border border-pebble/60 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-charcoal mb-1.5">
                    {item.badge}
                  </span>
                )}

                {/* Visual Image */}
                <div className="relative my-2 flex items-center justify-center">
                  <img
                    src={item.imgSrc}
                    alt={item.title}
                    className="w-20 h-20 object-contain drop-shadow-sm transition-transform duration-200"
                    loading="lazy"
                  />
                </div>

                {/* Title */}
                <div
                  className={`font-sans font-bold text-sm leading-tight ${
                    isSelected ? "text-forest-ink" : "text-obsidian"
                  }`}
                >
                  {item.title}
                </div>

                {/* Details */}
                <div className="font-mono text-[10px] text-slate mt-1 truncate">
                  {item.aboutProduct}
                </div>

                {item.extraInfo && (
                  <div className="font-mono text-[9px] text-forest-ink font-semibold mt-1.5">
                    {item.extraInfo}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Indicator Bar */}
      <div className="mt-3 font-mono text-xs text-slate flex items-center gap-2">
        <span>Current Selection:</span>
        <strong className="text-forest-ink font-bold px-2 py-0.5 rounded-md bg-linen-mist border border-forest-ink/20">
          {selectedId || "—"}
        </strong>
      </div>
    </div>
  );
};

export default CargoFanStack;