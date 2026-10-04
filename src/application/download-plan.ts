import { planCsv } from '../domain/iceberg.ts';

export function downloadPlan() {
  const url = URL.createObjectURL(
    new Blob(['\uFEFF', planCsv()], { type: 'text/csv;charset=utf-8' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'backrooms-fps-iceberg.csv';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
