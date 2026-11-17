const base = import.meta.env.BASE_URL;

const photos = {
  exterior: ['exterior-piscina', 3072, 4096],
  entrance: ['entrada-casa', 4096, 3072],
  facade: ['fachada-piscina', 4096, 3072],
  pool: ['piscina', 4096, 2732],
  poolside: ['zona-piscina', 4096, 3072],
  garden: ['jardim', 4096, 3072],
  gardenPath: ['caminho-jardim', 3072, 4096],
  waterfall: ['cachoeira', 4096, 3072],
  kitchen: ['cozinha', 4096, 3072],
  kitchenCounter: ['cozinha-ambiente', 4096, 3072],
  kitchenDining: ['cozinha-refeicoes', 4096, 3072],
  livingRoom: ['sala-estar', 4096, 3072],
  diningArea: ['sala-ampla', 4096, 3072],
  readingRoom: ['sala-leitura', 3072, 4096],
  mainBedroom: ['quarto-principal', 4096, 3072],
  mainBedroomDetail: ['quarto-principal-detalhe', 4096, 3072],
  mainBedroomView: ['quarto-principal-perspectiva', 4096, 3072],
  secondBedroom: ['quarto-secundario', 4096, 3072],
  extraBedroom: ['quarto-extra', 4096, 3072],
  bunkBedroom: ['quarto-beliche', 4096, 3072],
  bathroom: ['casa-banho', 4096, 3072],
  bathtub: ['banheira', 4096, 3072],
  suiteBathroom: ['casa-banho-suite', 4096, 3072],
  bathtubBathroom: ['banho-banheira', 4096, 2696],
  poolLounge: ['descanso-piscina', 4096, 2992],
  coveredPatio: ['alpendre-coberto', 4096, 3072],
  terrace: ['terraco', 4096, 3072],
  innerEntrance: ['interior-entrada', 4096, 3072],
  sidePool: ['piscina-lateral', 4096, 3072],
};

export const IM = Object.fromEntries(
  Object.entries(photos).map(([id, [file, w, h]]) => {
    const src = `${base}assets/guimbras/enhanced/${file}.webp`;
    const preview = `${base}assets/guimbras/enhanced/${file}-preview.webp`;
    return [
      id,
      {
        src,
        preview,
        srcSet: `${preview} ${Math.round((w * 1280) / 4096)}w, ${src} ${w}w`,
        w,
        h,
      },
    ];
  }),
);

export const TH = Object.fromEntries(
  Object.entries(IM).map(([id, image]) => [id, image.preview]),
);
