"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Eraser, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignaturePad({
  value,
  onChange,
  onRequestClear,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  onRequestClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasStrokeRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasElement = canvas;

    function prepareCanvas() {
      const rect = canvasElement.getBoundingClientRect();
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      canvasElement.width = Math.max(1, Math.round(rect.width * ratio));
      canvasElement.height = Math.max(1, Math.round(rect.height * ratio));
      const context = canvasElement.getContext("2d");
      if (!context) return;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, rect.width, rect.height);

      if (value) {
        const image = new Image();
        image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height);
        image.src = value;
      }
    }

    prepareCanvas();
    window.addEventListener("resize", prepareCanvas);
    return () => window.removeEventListener("resize", prepareCanvas);
  }, [value]);

  function point(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const current = point(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(current.x, current.y);
    context.strokeStyle = "#071426";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    drawingRef.current = true;
    hasStrokeRef.current = false;
  }

  function draw(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    event.preventDefault();
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const current = point(event);
    context.lineTo(current.x, current.y);
    context.stroke();
    hasStrokeRef.current = true;
  }

  function finishDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (hasStrokeRef.current) {
      onChange(event.currentTarget.toDataURL("image/png"));
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-bold">
          <PenLine className="text-emerald-300" />
          ลายมือชื่อ <span className="required-mark">*</span>
        </p>
        <Button
          type="button"
          className="action-neutral"
          size="sm"
          disabled={!value}
          onClick={onRequestClear}
        >
          <Eraser /> ล้างลายมือชื่อ
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="ช่องเขียนลายมือชื่อ"
        className="h-40 w-full touch-none rounded-lg border-2 border-dashed border-emerald-400/60 bg-white shadow-inner"
        onPointerCancel={finishDrawing}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={finishDrawing}
      />
      <p className="text-sm text-slate-400">
        เขียนลายมือชื่อด้วยเมาส์ ปากกา หรือปลายนิ้วภายในกรอบ
      </p>
    </div>
  );
}
