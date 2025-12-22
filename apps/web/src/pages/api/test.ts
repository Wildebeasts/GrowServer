
export function GET({ params, request }: { params: Record<string, string>; request: Request }) {

  return new Response(
    JSON.stringify({
      name: "Astro",
      url: "https://astro.build/",
    }),
  );
}