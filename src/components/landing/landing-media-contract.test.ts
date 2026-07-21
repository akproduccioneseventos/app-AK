import fs from "node:fs";
import path from "node:path";
import {
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
