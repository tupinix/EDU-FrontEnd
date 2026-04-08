import { useRef, useCallback, useState } from 'react';
import { DashboardWidget } from '../../types';
import { GaugeWidget } from './widgets/GaugeWidget';
import { ValueWidget } from './widgets/ValueWidget';
import { TrendWidget } from './widgets/TrendWidget';
import { StatusWidget } from './widgets/StatusWidget';
import { TankWidget } from './widgets/TankWidget';
import { LabelWidget } from './widgets/LabelWidget';
import { TextWidget } from './widgets/TextWidget';
import { BarWidget } from './widgets/BarWidget';
import { ImageWidget } from './widgets/ImageWidget';
import { RectangleWidget } from './widgets/RectangleWidget';

interface Props {
  widget: DashboardWidget;
  liveValue: unknown;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onMove: (x: number, y: number) => void;
  onMoveEnd?: () => void;
  onResize: (width: number, height: number) => void;
}

const HANDLE_SIZE = 8;

function renderWidgetContent(widget: DashboardWidget, value: unknown) {
  const props = { config: widget.config, value, width: widget.width, height: widget.height };
  switch (widget.type) {
    case 'gauge': return <GaugeWidget {...props} />;
    case 'value': return <ValueWidget {...props} />;
    case 'trend': return <TrendWidget {...props} />;
    case 'status': return <StatusWidget {...props} />;
    case 'tank': return <TankWidget {...props} />;
    case 'label': return <LabelWidget {...props} />;
    case 'text': return <TextWidget {...props} />;
    case 'bar': return <BarWidget {...props} />;
    case 'image': return <ImageWidget {...props} />;
    case 'rectangle': return <RectangleWidget {...props} />;
    default: return <div className="text-gray-500 text-xs p-2">Unknown widget: {widget.type}</div>;
  }
}

export function WidgetRenderer({ widget, liveValue, isEditMode, isSelected, onSelect, onMove, onMoveEnd, onResize }: Props) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number; corner: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [, setIsResizing] = useState(false);

  // Move handler
  const handleMouseDownMove = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    onSelect(e);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: widget.x,
      origY: widget.y,
    };
    setIsDragging(true);

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      onMove(
        Math.max(0, dragRef.current.origX + dx),
        Math.max(0, dragRef.current.origY + dy),
      );
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setIsDragging(false);
      onMoveEnd?.();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isEditMode, widget.x, widget.y, onSelect, onMove, onMoveEnd]);

  // Resize handler
  const handleMouseDownResize = useCallback((e: React.MouseEvent, corner: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: widget.width,
      origH: widget.height,
      corner,
    };
    setIsResizing(true);

    const handleMouseMove = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = me.clientX - resizeRef.current.startX;
      const dy = me.clientY - resizeRef.current.startY;
      let newW = resizeRef.current.origW;
      let newH = resizeRef.current.origH;

      if (corner.includes('r')) newW = Math.max(40, resizeRef.current.origW + dx);
      if (corner.includes('l')) newW = Math.max(40, resizeRef.current.origW - dx);
      if (corner.includes('b')) newH = Math.max(30, resizeRef.current.origH + dy);
      if (corner.includes('t')) newH = Math.max(30, resizeRef.current.origH - dy);

      // For left/top corners, also need to move position
      if (corner.includes('l')) {
        onMove(
          Math.max(0, widget.x + (resizeRef.current.origW - newW)),
          corner.includes('t') ? Math.max(0, widget.y + (resizeRef.current.origH - newH)) : widget.y,
        );
      } else if (corner.includes('t')) {
        onMove(widget.x, Math.max(0, widget.y + (resizeRef.current.origH - newH)));
      }

      onResize(newW, newH);
    };

    const handleMouseUp = () => {
      resizeRef.current = null;
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isEditMode, widget.x, widget.y, widget.width, widget.height, onMove, onResize]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditMode) onSelect(e);
  }, [isEditMode, onSelect]);

  const corners = [
    { key: 'tl', style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'nwse-resize' } },
    { key: 'tr', style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'nesw-resize' } },
    { key: 'bl', style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'nesw-resize' } },
    { key: 'br', style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'nwse-resize' } },
  ];

  // Map corner key to resize direction
  const cornerToDir: Record<string, string> = { tl: 'tl', tr: 'tr', bl: 'bl', br: 'br' };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseDown={handleMouseDownMove}
      className="absolute overflow-hidden"
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
        zIndex: isSelected ? 9999 : widget.zIndex,
        cursor: isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
        outline: isSelected ? '2px solid #3b82f6' : 'none',
        outlineOffset: '1px',
        borderRadius: widget.type === 'rectangle' ? undefined : '4px',
        userSelect: 'none',
      }}
    >
      {renderWidgetContent(widget, liveValue)}

      {/* Resize handles */}
      {isEditMode && isSelected && corners.map(({ key, style }) => (
        <div
          key={key}
          onMouseDown={(e) => handleMouseDownResize(e, cornerToDir[key])}
          className="absolute bg-blue-500 border border-white rounded-sm"
          style={{
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            ...style,
            zIndex: 10000,
          }}
        />
      ))}
    </div>
  );
}
