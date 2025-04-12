import { Resvg } from '@resvg/resvg-js';

export const removeStrokeFromSVG = (svg: string): string => {
  return svg.replace(/\\/g, '').replace(/\s*stroke="[^"]*"/g, '');
};

export const svgToBase64 = async (base64Svg: string): Promise<string> => {
  let svgString = base64Svg;
  svgString = svgString.replace(/width="(\d+)"/, 'width="400"'); // Replace width
  svgString = svgString.replace(/height="(\d+)"/, 'height="80"'); // Replace height
  const resvg = new Resvg(svgString);
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const binaryString = String.fromCharCode.apply(null, pngBuffer);
  const base64String = btoa(binaryString);
  return `data:image/png;base64,${base64String}`;
};
