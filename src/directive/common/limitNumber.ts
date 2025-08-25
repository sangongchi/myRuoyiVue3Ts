import { Directive,DirectiveBinding } from 'vue';

interface NumberDirectiveConfig {
  decimal?: boolean;
  negative?: boolean;
  min?: number;
  max?: number;
  maxDecimal?: number;
  autoRound?: boolean;
}

const NumberDirective: Directive = {
  mounted(el: any, binding: DirectiveBinding<NumberDirectiveConfig>) {
    let isComposing = false;
    const config = {
      decimal: binding.modifiers.decimal,
      negative: binding.modifiers.negative,
      ...binding.value
    } as NumberDirectiveConfig;

    // 中文输入法处理
    const handleCompositionStart = () => {
      isComposing = true;
    };

    const handleCompositionEnd = (event: CompositionEvent) => {
      isComposing = false;
      triggerInput(event.target as HTMLInputElement);
    };

    // 主输入处理
    const handleInput = (event: Event) => {
      if (isComposing) return;

      const target = event.target as HTMLInputElement;
      const oldValue = target.value;
      const newValue = processValue(oldValue, config);

      if (newValue !== oldValue) {
        target.value = newValue;
        triggerInput(target);
      }
    };

    // 事件监听
    el.addEventListener('compositionstart', handleCompositionStart);
    el.addEventListener('compositionend', handleCompositionEnd);
    el.addEventListener('input', handleInput);

    // 初始处理
    triggerInput(el);

    // 清理事件
    el._cleanup = () => {
      el.removeEventListener('compositionstart', handleCompositionStart);
      el.removeEventListener('compositionend', handleCompositionEnd);
      el.removeEventListener('input', handleInput);
    };
  },
  beforeUnmount(el: any) {
    el._cleanup?.();
  }
};

function processValue(value: string, config: NumberDirectiveConfig): string {
  let filtered = value;
  if (!value) return '';
  // 符号处理
  filtered = config.negative
    ? filtered.replace(/(?!^-)-/g, '') // 移除中间负号
    : filtered.replace(/-/g, '');

  // 数字过滤
  const allowChars = `\\d${config.decimal ? '.' : ''}${config.negative ? '-?' : ''}`;
  filtered = filtered.replace(new RegExp(`[^${allowChars}]`, 'g'), '');

  // 小数处理
  if (config.decimal) {
    const [integerPart, decimalPart] = filtered.split('.');

    // 处理多个小数点
    if (decimalPart !== undefined) {
      filtered = `${integerPart}.${decimalPart.replace(/\./g, '')}`;
    }

    // 小数位限制
    if (config.maxDecimal !== undefined && decimalPart) {
      filtered = `${integerPart}.${decimalPart.slice(0, config.maxDecimal)}`;

      // 自动四舍五入
      if (config.autoRound && decimalPart.length > config.maxDecimal) {
        const rounded = parseFloat(filtered).toFixed(config.maxDecimal);
        return rounded.toString();
      }
    }

    // 处理纯小数
    if (filtered.startsWith('.')) {
      filtered = `0${filtered}`;
    }
  } else {
    filtered = filtered.replace(/\./g, '');
  }

  // 去除前导零
  if (!filtered.startsWith('0') || filtered.includes('.') || filtered === '') {
    filtered = filtered.replace(/^0+(\d)/, '$1');
  }

  // 范围限制
  const numValue = parseFloat(filtered);
  if (!isNaN(numValue)) {
    if (config.min !== undefined && numValue < config.min) {
      return config.min.toString();
    }
    if (config.max !== undefined && numValue > config.max) {
      return config.max.toString();
    }
  }

  return filtered;
}

function triggerInput(target: HTMLInputElement) {
  const event = new Event('input', { bubbles: true });
  target.dispatchEvent(event);
}

export default NumberDirective;



// <!-- 基础用法 -->
// <input v-limtNumber>

// <!-- 完整配置 -->
// <input v-limtNumber="{
//   decimal: true,
//   negative: true,
//   min: -100,
//   max: 1000,
//   maxDecimal: 2,
//   autoRound: true
// }">