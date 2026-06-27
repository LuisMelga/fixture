export type KoTuple = [number, string, string];
export const R32_SEED: Record<number, [string, string]> = {
  73:["2A","2B"], 74:["1E","3°"], 75:["1F","2C"], 76:["1C","2F"],
  77:["1I","3°"], 78:["2E","2I"], 79:["1A","3°"], 80:["1L","3°"],
  81:["1D","3°"], 82:["1G","3°"], 83:["2K","2L"], 84:["1H","2J"],
  85:["1B","3°"], 86:["1J","2H"], 87:["1K","3°"], 88:["2D","2G"]
};
export const R32_DATE: Record<number, string> = {
  73:"Dom 28-06",74:"Lun 29-06",75:"Lun 29-06",76:"Lun 29-06",
  77:"Mar 30-06",78:"Mar 30-06",79:"Mar 30-06",80:"Mié 01-07",
  81:"Mié 01-07",82:"Mié 01-07",83:"Jue 02-07",84:"Jue 02-07",
  85:"Vie 03-07",86:"Vie 03-07",87:"Vie 03-07",88:"Vie 03-07"
};
export const R16: KoTuple[] = [[89,"W74","W77"],[90,"W73","W75"],[91,"W76","W78"],[92,"W79","W80"],
            [93,"W83","W84"],[94,"W81","W82"],[95,"W86","W88"],[96,"W85","W87"]];
export const R16_DATE: Record<number, string> = {89:"Sáb 04-07",90:"Sáb 04-07",91:"Dom 05-07",92:"Dom 05-07",93:"Lun 06-07",94:"Lun 06-07",95:"Mar 07-07",96:"Mar 07-07"};
export const QF: KoTuple[] = [[97,"W89","W90"],[98,"W93","W94"],[99,"W91","W92"],[100,"W95","W96"]];
export const QF_DATE: Record<number, string> = {97:"Jue 09-07",98:"Vie 10-07",99:"Sáb 11-07",100:"Sáb 11-07"};
export const SF: KoTuple[] = [[101,"W97","W98"],[102,"W99","W100"]];
export const SF_DATE: Record<number, string> = {101:"Mar 14-07",102:"Mié 15-07"};
export const THIRD: KoTuple[] = [[103,"L101","L102"]];
export const THIRD_DATE: Record<number, string> = {103:"Sáb 18-07"};
export const FINAL: KoTuple[] = [[104,"W101","W102"]];
export const FINAL_DATE: Record<number, string> = {104:"Dom 19-07"};
