import fs from "node:fs";
import path from "node:path";
import {
  classifyGalleryCategories,
  dedupeGalleryImages,
  type LandingGalleryItem,
} from "./GallerySection";
import {
  dedupeVideoItems,
  galeriaVideoToVideoItem,
  getVideoPlaybackSource,
  type VideoItem,
} from "./VideoSection";
import { getVisibleSalonPhotos } from "./SalonDestacadoSection";
import { isAdditionalLandingService } from "./ServicesSection";
import {
  PUBLIC_EVENT_TYPE_IMAGES,
  getPublicEventTypeImage,
} from "./event-type-images";

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const galleryItem = (src: string): LandingGalleryItem => ({
  id: src,
  src,
  alt: "Evento real",
  hint: "evento",
  categorias: ["Fotografía"],
});

describe("public landing media contracts", () => {
  it("deduplicates gallery images by normalized source URL", () => {
    expect(
      dedupeGalleryImages([
        galleryItem("https://cdn.example.com/evento.jpg?width=1200"),
        galleryItem("https://cdn.example.com/evento.jpg?width=800"),
        galleryItem("/media/evento-2.jpg"),
      ]),
    ).toHaveLength(2);
  });

  it("uses one prioritized category and never sends a dish to Decoracion because of incidental copy", () => {
    expect(
      classifyGalleryCategories(
        "Kebab gourmet",
        "Mesa con decoracion y velas para una fiesta de 15",
        "Decoracion",
      ),
    ).toEqual(["Catering"]);
    expect(
      classifyGalleryCategories("Momento de la fiesta", "", "Barra de tragos"),
    ).toEqual(["Barra de Tragos"]);
    expect(
      classifyGalleryCategories(
        "Trabajo reciente de AK Producciones",
        "Una noche con decoracion, luces y amigos.",
        "Instagram",
      ),
    ).toEqual(["Eventos"]);
  });

  it("keeps the historical kebab photo in catering and out of wedding pages", () => {
    const gallery = JSON.parse(read("src/data/galeria-publica.json")) as {
      fotos: Array<{ url: string; titulo: string; servicio: string }>;
    };
    const kebab = gallery.fotos.find(
      (photo) => photo.url === "/media/catalogo-servicios/boda-decoracion-dorada-01.jpeg",
    );

    expect(kebab).toMatchObject({
      titulo: "Kebab gourmet para eventos",
      servicio: "Catering",
    });
    expect(read("src/app/landing/bodas/page.tsx")).not.toContain(
      "boda-decoracion-dorada-01.jpeg",
    );
  });

  it("uses verified event imagery and never a blog or budget illustration for a party type", () => {
    expect(getPublicEventTypeImage("XV Años")).toBe(PUBLIC_EVENT_TYPE_IMAGES.xv);
    expect(getPublicEventTypeImage("Fiesta de quince")).toBe(PUBLIC_EVENT_TYPE_IMAGES.xv);
    expect(getPublicEventTypeImage("Boda de gala")).toBe(PUBLIC_EVENT_TYPE_IMAGES.boda);
    expect(Object.values(PUBLIC_EVENT_TYPE_IMAGES)).not.toContain(
      "/media/catalogo-servicios/blog_presupuesto.png",
    );
    expect(PUBLIC_EVENT_TYPE_IMAGES.xv).toBe(
      "/media/catalogo-servicios/xv-pista-iluminada-01.jpeg",
    );
  });

  it("does not repeat event types or their dedicated homepage sections as extra services", () => {
    expect(isAdditionalLandingService({ title: "Bodas" })).toBe(false);
    expect(isAdditionalLandingService({ title: "XV Años" })).toBe(false);
    expect(isAdditionalLandingService({ title: "Salón Club Uruguay" })).toBe(false);
    expect(isAdditionalLandingService({ title: "Tecnología Interactiva" })).toBe(false);
    expect(isAdditionalLandingService({ title: "Plataforma 360" })).toBe(true);
  });

  it("deduplicates source identifiers, canonical links and fingerprinted filenames without hiding generic names", () => {
    const instagram = {
      ...galleryItem("https://cdn.instagram.com/media/photo-1.jpg?width=1200"),
      id: "instagram-copy",
      source: "instagram" as const,
      sourceId: "ig_178923456789",
      sourceUrl: "https://www.instagram.com/p/AK-event/?utm_source=feed",
    };
    const galleryCopy = {
      ...galleryItem("https://images.example.com/other-file.jpg"),
      id: "gallery-copy",
      source: "manual" as const,
      sourceId: "ig_178923456789",
      sourceUrl: "https://www.instagram.com/p/AK-event/",
    };
    const firstGenericName = galleryItem("https://one.example.com/photos/evento.jpg");
    const secondGenericName = galleryItem("https://two.example.com/archive/evento.jpg");
    const canonicalLink = {
      ...galleryItem("https://cdn.example.com/first-copy.jpg"),
      sourceUrl: "https://www.instagram.com/p/ak-other-event/?utm_source=feed",
    };
    const canonicalLinkCopy = {
      ...galleryItem("https://cdn.example.com/second-copy.jpg"),
      sourceUrl: "https://www.instagram.com/p/ak-other-event/",
    };
    const fingerprintedFile = galleryItem("https://one.example.com/7f551858d4c122c3e2553cabb4710eca.jpg");
    const fingerprintedFileCopy = galleryItem("https://two.example.com/7f551858d4c122c3e2553cabb4710eca.jpg");

    expect(
      dedupeGalleryImages([
        instagram,
        galleryCopy,
        canonicalLink,
        canonicalLinkCopy,
        fingerprintedFile,
        fingerprintedFileCopy,
        firstGenericName,
        secondGenericName,
      ]),
    ).toEqual([instagram, canonicalLink, fingerprintedFile, firstGenericName, secondGenericName]);
  });

  it("keeps all video sources and plays each supported platform", () => {
    const youtube: VideoItem = {
      id: "youtube-1",
      title: "YouTube",
      description: "",
      thumbnailUrl: "",
      youtubeId: "abc123",
    };
    const duplicateYoutube = { ...youtube, id: "manual-1", featured: true };
    const instagram = galeriaVideoToVideoItem({
      id: "instagram-1",
      tipo: "video",
      youtubeUrl: "https://www.instagram.com/reel/ABC987/",
      youtubeId: "instagram-1",
      plataforma: "archivo",
      thumbnailUrl: "https://cdn.example.com/reel.jpg",
      titulo: "Instagram",
      categoria: "Instagram",
      destacada: false,
      orden: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const file: VideoItem = {
      id: "file-1",
      title: "Archivo",
      description: "",
      thumbnailUrl: "",
      embedUrl: "https://cdn.example.com/evento.mp4",
    };

    expect(dedupeVideoItems([youtube, duplicateYoutube, instagram, file])).toHaveLength(3);
    expect(getVideoPlaybackSource(youtube)?.src).toContain("youtube.com/embed/abc123");
    expect(getVideoPlaybackSource(instagram)).toEqual({
      kind: "iframe",
      src: "https://www.instagram.com/reel/ABC987/embed",
    });
    expect(getVideoPlaybackSource(file)?.kind).toBe("video");
  });

  it("keeps the salon preview bounded and uses only salon media on Club Uruguay", () => {
    const photos = Array.from({ length: 5 }, (_, index) => ({
      src: `/salon-${index}.jpg`,
      alt: "Salon",
      title: "Salon",
    }));
    expect(getVisibleSalonPhotos(photos)).toHaveLength(3);

    const clubPage = read("src/app/club-uruguay/page.tsx");
    expect(clubPage).toContain("uniquePhotos([...masterPhotos, ...getDynamicSalonPhotos()])");
    expect(clubPage).toContain("canUseNextImage");
    expect(clubPage).not.toContain("<GallerySection");
  });
});
