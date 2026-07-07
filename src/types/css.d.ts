// CSS module declarations — required so TypeScript accepts CSS side-effect imports
// e.g. import '@/styles/globals.css'
declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}
