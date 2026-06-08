import { useState, useEffect } from 'react';
import { InputNumber } from 'antd';
import type { InputNumberProps } from 'antd';

/**
 * 稳定的数字输入组件——本地 state 缓存输入值，
 * 仅在 onBlur 时同步回父组件，避免每次按键触发父组件重渲染
 * 导致的光标丢失/小数输入中断问题。
 *
 * 适用于 Table render 函数、.map() 循环等场景。
 */
interface StableInputNumberProps extends Omit<InputNumberProps, 'onChange'> {
  onValueChange: (v: number) => void;
}

export function StableInputNumber({ value, onValueChange, ...rest }: StableInputNumberProps) {
  const [local, setLocal] = useState<number | null>(value as number);

  useEffect(() => {
    setLocal(value as number);
  }, [value]);

  return (
    <InputNumber
      value={local}
      onChange={(v) => setLocal(v as number | null)}
      onBlur={() => onValueChange(local ?? 0)}
      {...rest}
    />
  );
}