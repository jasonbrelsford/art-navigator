// Art database — verified open-access images from Met Museum & Art Institute of Chicago
const ART_DB = {
  artists: {
    "vermeer": {
      name: "Johannes Vermeer",
      born: "1632, Delft, Dutch Republic",
      died: "1675, Delft, Dutch Republic",
      bio: "Dutch Golden Age painter who specialized in domestic interior scenes of middle-class life. Known for his masterful treatment of light and meticulous composition. Only about 34 paintings are attributed to him.",
      contact: "Historical artist (1632–1675) — no living contact. Estate represented by the Vermeer Centre Delft, Voldersgracht 21, 2611 EV Delft, Netherlands.",
      influencedBy: ["caravaggio"],
      socialCircle: [],
      techniques: ["sfumato", "camera obscura", "pointillé"]
    },
    "monet": {
      name: "Claude Monet",
      born: "1840, Paris, France",
      died: "1926, Giverny, France",
      bio: "Founder of French Impressionist painting. His practice of plein air landscape painting was a radical departure from tradition. His ambition to document the French countryside led him to adopt a method of painting the same scene many times to capture the changing of light and seasons.",
      contact: "Historical artist (1840–1926) — no living contact. Foundation Claude Monet, 84 Rue Claude Monet, 27620 Giverny, France.",
      influencedBy: ["manet"],
      socialCircle: ["renoir", "caillebotte", "manet", "degas", "cassatt"],
      techniques: ["plein air", "impasto", "broken color"]
    },
    "vangogh": {
      name: "Vincent van Gogh",
      born: "1853, Zundert, Netherlands",
      died: "1890, Auvers-sur-Oise, France",
      bio: "Post-Impressionist painter whose work had a far-reaching influence on 20th-century art. In a decade he created about 2,100 artworks, including around 860 oil paintings. His bold colors and dramatic, expressive brushwork contributed to the foundations of modern art.",
      contact: "Historical artist (1853–1890) — no living contact. Van Gogh Museum, Museumplein 6, 1071 DJ Amsterdam, Netherlands.",
      influencedBy: ["hokusai", "rembrandt", "monet"],
      socialCircle: ["gauguin"],
      techniques: ["impasto", "broken color", "complementary contrast"]
    },
    "rembrandt": {
      name: "Rembrandt van Rijn",
      born: "1606, Leiden, Dutch Republic",
      died: "1669, Amsterdam, Dutch Republic",
      bio: "Dutch Golden Age painter and printmaker. An innovative and prolific master in three media, he is generally considered one of the greatest visual artists in the history of art. His works depict a range of style and subject matter, from portraits to landscapes, and from biblical to mythological scenes.",
      contact: "Historical artist (1606–1669) — no living contact. Rembrandt House Museum, Jodenbreestraat 4, 1011 NK Amsterdam, Netherlands.",
      influencedBy: ["caravaggio"],
      socialCircle: [],
      techniques: ["chiaroscuro", "impasto", "glazing"]
    },
    "hokusai": {
      name: "Katsushika Hokusai",
      born: "1760, Edo (Tokyo), Japan",
      died: "1849, Edo (Tokyo), Japan",
      bio: "Japanese ukiyo-e artist of the Edo period, active as a painter and printmaker. Achieved international fame with the woodblock print series Thirty-six Views of Mount Fuji, which includes the iconic print The Great Wave off Kanagawa.",
      contact: "Historical artist (1760–1849) — no living contact. Sumida Hokusai Museum, 2-7-2 Kamezawa, Sumida City, Tokyo 130-0014, Japan.",
      influencedBy: [],
      socialCircle: [],
      techniques: ["woodblock printing", "ukiyo-e"]
    },
    "renoir": {
      name: "Pierre-Auguste Renoir",
      born: "1841, Limoges, France",
      died: "1919, Cagnes-sur-Mer, France",
      bio: "French Impressionist painter who celebrated beauty and feminine sensuality. He was a leading painter in the development of the Impressionist style, known for his vibrant light and saturated color, most often focusing on people in intimate and candid compositions.",
      contact: "Historical artist (1841–1919) — no living contact. Musée Renoir, Chemin des Collettes, 06800 Cagnes-sur-Mer, France.",
      influencedBy: ["manet"],
      socialCircle: ["monet", "caillebotte", "degas", "cassatt"],
      techniques: ["plein air", "broken color", "glazing"]
    },
    "degas": {
      name: "Edgar Degas",
      born: "1834, Paris, France",
      died: "1917, Paris, France",
      bio: "French Impressionist artist famous for his paintings, sculptures, prints, and drawings. He is especially identified with the subject of dance; more than half of his works depict dancers. Regarded as one of the founders of Impressionism.",
      contact: "Historical artist (1834–1917) — no living contact. Musée d'Orsay, 1 Rue de la Légion d'Honneur, 75007 Paris, France.",
      influencedBy: ["manet"],
      socialCircle: ["monet", "renoir", "cassatt", "manet", "caillebotte"],
      techniques: ["pastel", "monotype", "unusual angles"]
    },
    "seurat": {
      name: "Georges Seurat",
      born: "1859, Paris, France",
      died: "1891, Paris, France",
      bio: "French post-Impressionist artist and the pioneer of the Neo-Impressionist technique known as Pointillism. His large-scale work A Sunday on La Grande Jatte altered the direction of modern art by initiating Neo-Impressionism.",
      contact: "Historical artist (1859–1891) — no living contact. Art Institute of Chicago, 111 S Michigan Ave, Chicago, IL 60603, USA.",
      influencedBy: ["monet"],
      socialCircle: [],
      techniques: ["pointillism", "divisionism", "chromoluminarism"]
    },
    "caillebotte": {
      name: "Gustave Caillebotte",
      born: "1848, Paris, France",
      died: "1894, Gennevilliers, France",
      bio: "French painter and patron of the Impressionists. His paintings combined Impressionist and Realist elements, often depicting urban scenes of Paris with striking perspective. Also a major collector who bequeathed his collection to the French state.",
      contact: "Historical artist (1848–1894) — no living contact. Musée d'Orsay, 1 Rue de la Légion d'Honneur, 75007 Paris, France.",
      influencedBy: ["manet", "monet"],
      socialCircle: ["monet", "renoir", "degas"],
      techniques: ["plein air", "photographic perspective", "realism"]
    },
    "cassatt": {
      name: "Mary Cassatt",
      born: "1844, Allegheny City, Pennsylvania, USA",
      died: "1926, Le Mesnil-Théribus, France",
      bio: "American Impressionist painter and printmaker who lived much of her adult life in France. She was one of only three female artists invited to exhibit with the Impressionists. Known for her intimate depictions of mothers and children.",
      contact: "Historical artist (1844–1926) — no living contact. Art Institute of Chicago, 111 S Michigan Ave, Chicago, IL 60603, USA.",
      influencedBy: ["degas", "hokusai"],
      socialCircle: ["degas", "monet", "renoir"],
      techniques: ["pastel", "printmaking", "Japanese influence"]
    },
    "hopper": {
      name: "Edward Hopper",
      born: "1882, Nyack, New York, USA",
      died: "1967, New York City, USA",
      bio: "American realist painter and printmaker. His most famous work, Nighthawks, depicts people sitting in a downtown diner late at night. His stark, cinematic compositions and masterful use of light and shadow have made him one of America's most recognizable artists.",
      contact: "Historical artist (1882–1967) — no living contact. Whitney Museum of American Art, 99 Gansevoort St, New York, NY 10014, USA.",
      influencedBy: ["manet", "rembrandt"],
      socialCircle: [],
      techniques: ["realism", "chiaroscuro", "cinematic composition"]
    },
    "caravaggio": {
      name: "Caravaggio (Michelangelo Merisi)",
      born: "1571, Milan, Duchy of Milan",
      died: "1610, Porto Ercole, Tuscany",
      bio: "Italian painter active in Rome for most of his artistic life. His paintings combine a realistic observation of the human state with a dramatic use of lighting, known as chiaroscuro. He had a profound influence on Baroque painting.",
      contact: "Historical artist (1571–1610) — no living contact. Galleria Borghese, Piazzale Scipione Borghese 5, 00197 Rome, Italy.",
      influencedBy: [],
      socialCircle: [],
      techniques: ["chiaroscuro", "tenebrism", "realism"]
    },
    "gauguin": {
      name: "Paul Gauguin",
      born: "1848, Paris, France",
      died: "1903, Atuona, Marquesas Islands",
      bio: "French Post-Impressionist artist who was not well appreciated until after his death. He is now recognized for his experimental use of color and Synthetist style that were distinct from Impressionism. His work influenced the French avant-garde and many modern artists.",
      contact: "Historical artist (1848–1903) — no living contact. Musée d'Orsay, 1 Rue de la Légion d'Honneur, 75007 Paris, France.",
      influencedBy: ["monet", "degas"],
      socialCircle: ["vangogh"],
      techniques: ["synthetism", "cloisonnism", "flat color"]
    },
    "manet": {
      name: "Édouard Manet",
      born: "1832, Paris, France",
      died: "1883, Paris, France",
      bio: "French modernist painter, one of the first 19th-century artists to paint modern life. A pivotal figure in the transition from Realism to Impressionism. His bold brushwork and contemporary subjects were controversial in their time.",
      contact: "Historical artist (1832–1883) — no living contact. Musée d'Orsay, 1 Rue de la Légion d'Honneur, 75007 Paris, France.",
      influencedBy: ["rembrandt", "caravaggio"],
      socialCircle: ["monet", "renoir", "degas", "caillebotte"],
      techniques: ["alla prima", "flat color", "bold brushwork"]
    }
  },
  museums: {
    "met": {
      name: "The Metropolitan Museum of Art",
      city: "New York, USA",
      address: "1000 Fifth Avenue, New York, NY 10028, USA",
      website: "https://www.metmuseum.org"
    },
    "artic": {
      name: "Art Institute of Chicago",
      city: "Chicago, USA",
      address: "111 S Michigan Ave, Chicago, IL 60603, USA",
      website: "https://www.artic.edu"
    },
    "orsay": {
      name: "Musée d'Orsay",
      city: "Paris, France",
      address: "1 Rue de la Légion d'Honneur, 75007 Paris, France",
      website: "https://www.musee-orsay.fr"
    },
    "rijksmuseum": {
      name: "Rijksmuseum",
      city: "Amsterdam, Netherlands",
      address: "Museumstraat 1, 1071 XX Amsterdam, Netherlands",
      website: "https://www.rijksmuseum.nl"
    },
    "nationalgallery": {
      name: "National Gallery",
      city: "London, UK",
      address: "Trafalgar Square, London WC2N 5DN, UK",
      website: "https://www.nationalgallery.org.uk"
    }
  },
  artworks: [
    // === VERMEER ===
    {
      id: "vermeer-water-pitcher",
      title: "Young Woman with a Water Pitcher",
      artistId: "vermeer",
      year: "c. 1662",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "met",
      galleryRoom: "Room 614",
      patron: "Pieter van Ruijven (likely patron)",
      provenance: "Possibly in the Dissius sale, Amsterdam, 1696. Acquired by Henry Marquand and donated to the Metropolitan Museum of Art in 1889.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP353257.jpg"
    },
    {
      id: "vermeer-study-young-woman",
      title: "Study of a Young Woman",
      artistId: "vermeer",
      year: "c. 1665–1667",
      medium: "Oil on canvas",
      genre: "portrait",
      museumId: "met",
      galleryRoom: "Room 614",
      patron: "Pieter van Ruijven (likely patron)",
      provenance: "Collection of Rodolphe Kann, Paris. Acquired by Benjamin Altman and bequeathed to the Metropolitan Museum of Art in 1913.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP353256.jpg"
    },
    {
      id: "vermeer-young-woman-lute",
      title: "Young Woman with a Lute",
      artistId: "vermeer",
      year: "c. 1662–1663",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "met",
      galleryRoom: "Room 614",
      patron: "Pieter van Ruijven (likely patron)",
      provenance: "Possibly in the Dissius sale, Amsterdam, 1696. Acquired by Collis P. Huntington. Bequeathed to the Metropolitan Museum of Art in 1900.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP354965.jpg"
    },
    // === MONET ===
    {
      id: "monet-water-lilies",
      title: "Water Lilies",
      artistId: "monet",
      year: "1906",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "artic",
      galleryRoom: "Gallery 243",
      patron: "Paul Durand-Ruel (dealer/buyer)",
      provenance: "Painted at Giverny. Sold by Monet to Durand-Ruel gallery in 1909. Passed through several private collections. Acquired by the Art Institute of Chicago in 1933.",
      image: "https://www.artic.edu/iiif/2/3c27b499-af56-f0d5-93b5-a7f2f1ad5813/full/400,/0/default.jpg"
    },
    {
      id: "monet-water-lily-pond",
      title: "Water Lily Pond",
      artistId: "monet",
      year: "1900",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "artic",
      galleryRoom: "Gallery 243",
      patron: "Self-funded (painted at Giverny)",
      provenance: "Painted at Giverny. Part of a series depicting the Japanese bridge over Monet's water garden. Acquired by the Art Institute of Chicago.",
      image: "https://www.artic.edu/iiif/2/8534685d-1102-e1e3-e194-94f6e925e8b0/full/400,/0/default.jpg"
    },
    {
      id: "monet-normandy-train",
      title: "Arrival of the Normandy Train, Gare Saint-Lazare",
      artistId: "monet",
      year: "1877",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "artic",
      galleryRoom: "Gallery 201",
      patron: "Self-funded (exhibited at Impressionist show)",
      provenance: "Part of Monet's series of the Gare Saint-Lazare. Exhibited at the third Impressionist exhibition in 1877. Acquired by the Art Institute of Chicago.",
      image: "https://www.artic.edu/iiif/2/0f1cc0e0-e42e-be16-3f71-2022da38cb93/full/400,/0/default.jpg"
    },
    {
      id: "monet-stacks-wheat",
      title: "Stacks of Wheat (End of Summer)",
      artistId: "monet",
      year: "1890–1891",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "artic",
      galleryRoom: "Gallery 243",
      patron: "Paul Durand-Ruel (dealer/buyer)",
      provenance: "Part of Monet's famous Haystacks series. Painted near his home in Giverny. Acquired by the Art Institute of Chicago.",
      image: "https://www.artic.edu/iiif/2/a38e2828-ec6f-ece1-a30f-70243449197b/full/400,/0/default.jpg"
    },
    {
      id: "monet-beach-sainte-adresse",
      title: "The Beach at Sainte-Adresse",
      artistId: "monet",
      year: "1867",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "artic",
      galleryRoom: "Gallery 201",
      patron: "Self-funded (early career work)",
      provenance: "Painted during Monet's early career at the Normandy coast. Acquired by the Art Institute of Chicago.",
      image: "https://www.artic.edu/iiif/2/95be2572-b53d-8e7b-abc9-10eb48d4fa5d/full/400,/0/default.jpg"
    },
    // === VAN GOGH ===
    {
      id: "vangogh-wheat-cypresses",
      title: "Wheat Field with Cypresses",
      artistId: "vangogh",
      year: "1889",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "met",
      galleryRoom: "Room 822",
      patron: "The Annenberg Foundation (acquisition funder)",
      provenance: "Painted at the Saint-Paul-de-Mausole asylum in Saint-Rémy-de-Provence. Acquired by the Metropolitan Museum of Art, Purchase, The Annenberg Foundation Gift, 1993.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP-42549-001.jpg"
    },
    {
      id: "vangogh-self-portrait-hat",
      title: "Self-Portrait with a Straw Hat",
      artistId: "vangogh",
      year: "1887",
      medium: "Oil on canvas",
      genre: "portrait",
      museumId: "met",
      galleryRoom: "Room 825",
      patron: "Self-funded (personal work)",
      provenance: "Painted in Paris. Reverse side contains The Potato Peeler. Part of the Bequest of Miss Adelaide Milton de Groot to the Metropolitan Museum of Art, 1967.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DT1502_cropped2.jpg"
    },
    {
      id: "vangogh-irises",
      title: "Irises",
      artistId: "vangogh",
      year: "1890",
      medium: "Oil on canvas",
      genre: "still-life",
      museumId: "met",
      galleryRoom: "Room 822",
      patron: "Theo van Gogh (brother/supporter)",
      provenance: "Painted at Saint-Rémy-de-Provence. Acquired by the Metropolitan Museum of Art, Gift of Adele R. Levy, 1958.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP346474.jpg"
    },
    {
      id: "vangogh-sunflowers",
      title: "Sunflowers",
      artistId: "vangogh",
      year: "1887",
      medium: "Oil on canvas",
      genre: "still-life",
      museumId: "met",
      galleryRoom: "Room 825",
      patron: "Theo van Gogh (brother/supporter)",
      provenance: "Painted in Paris. Part of a series of still lifes with sunflowers. Acquired by the Metropolitan Museum of Art, Rogers Fund, 1949.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP-41223-001.jpg"
    },
    {
      id: "vangogh-cypresses",
      title: "Cypresses",
      artistId: "vangogh",
      year: "1889",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "met",
      galleryRoom: "Room 825",
      patron: "Theo van Gogh (brother/supporter)",
      provenance: "Painted at Saint-Rémy-de-Provence. Van Gogh considered this among his best summer landscapes. Acquired by the Metropolitan Museum of Art, Rogers Fund, 1949.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP130999.jpg"
    },
    {
      id: "vangogh-oleanders",
      title: "Oleanders",
      artistId: "vangogh",
      year: "1888",
      medium: "Oil on canvas",
      genre: "still-life",
      museumId: "met",
      galleryRoom: "Room 825",
      patron: "Theo van Gogh (brother/supporter)",
      provenance: "Painted in Arles. Acquired by the Metropolitan Museum of Art, Gift of Mr. and Mrs. John L. Loeb, 1962.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DT1494.jpg"
    },
    {
      id: "vangogh-bedroom",
      title: "The Bedroom",
      artistId: "vangogh",
      year: "1889",
      medium: "Oil on canvas",
      genre: "interior",
      museumId: "artic",
      galleryRoom: "Gallery 241",
      patron: "Theo van Gogh (brother/supporter)",
      provenance: "Third version painted at Saint-Rémy. Acquired by the Art Institute of Chicago through the Helen Birch Bartlett Memorial Collection.",
      image: "https://www.artic.edu/iiif/2/6644829f-f292-c5c4-a73c-0356a6fdbf0d/full/400,/0/default.jpg"
    },
    {
      id: "vangogh-self-portrait-artic",
      title: "Self-Portrait",
      artistId: "vangogh",
      year: "1887",
      medium: "Oil on artist's board, mounted on cradled panel",
      genre: "portrait",
      museumId: "artic",
      galleryRoom: "Gallery 241",
      patron: "Theo van Gogh (brother/supporter)",
      provenance: "Painted in Paris during Van Gogh's time with the Impressionists. Acquired by the Art Institute of Chicago, Joseph Winterbotham Collection.",
      image: "https://www.artic.edu/iiif/2/47c5bcb8-62ef-e5d7-55e7-f5121f409a30/full/400,/0/default.jpg"
    },
    {
      id: "vangogh-first-steps",
      title: "First Steps, after Millet",
      artistId: "vangogh",
      year: "1890",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "met",
      galleryRoom: "Room 825",
      patron: "Theo van Gogh (brother/supporter)",
      provenance: "Painted at Saint-Rémy after a print by Jean-François Millet. Acquired by the Metropolitan Museum of Art, Gift of George N. and Helen M. Richard, 1964.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP124808.jpg"
    },
    {
      id: "vangogh-olive-trees",
      title: "Olive Trees",
      artistId: "vangogh",
      year: "1889",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "met",
      galleryRoom: "Room 822",
      patron: "Theo van Gogh (brother/supporter)",
      provenance: "Painted at Saint-Rémy-de-Provence. Part of a series of olive grove paintings. Acquired by the Metropolitan Museum of Art, The Walter H. and Leonore Annenberg Collection, 1998.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DT1946.jpg"
    },
    // === REMBRANDT ===
    {
      id: "rembrandt-aristotle",
      title: "Aristotle with a Bust of Homer",
      artistId: "rembrandt",
      year: "1653",
      medium: "Oil on canvas",
      genre: "portrait",
      museumId: "met",
      galleryRoom: "Room 616",
      patron: "Don Antonio Ruffo of Messina",
      provenance: "Commissioned by Don Antonio Ruffo of Messina. Sold at auction in 1961 for $2.3 million, a record at the time. Acquired by the Metropolitan Museum of Art.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP-30758-001.jpg"
    },
    {
      id: "rembrandt-self-portrait",
      title: "Self-Portrait",
      artistId: "rembrandt",
      year: "1660",
      medium: "Oil on canvas",
      genre: "portrait",
      museumId: "met",
      galleryRoom: "Room 616",
      patron: "Self-funded (personal work)",
      provenance: "One of over 80 self-portraits by Rembrandt. Acquired by the Metropolitan Museum of Art, Bequest of Benjamin Altman, 1913.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP-16323-001.jpg"
    },
    {
      id: "rembrandt-hendrickje",
      title: "Hendrickje Stoffels",
      artistId: "rembrandt",
      year: "c. 1654–1656",
      medium: "Oil on canvas",
      genre: "portrait",
      museumId: "met",
      galleryRoom: "Room 616",
      patron: "Self-funded (personal work)",
      provenance: "Portrait of Rembrandt's companion Hendrickje Stoffels. Acquired by the Metropolitan Museum of Art, Gift of Archer M. Huntington, 1926.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP145920.jpg"
    },
    {
      id: "rembrandt-herman-doomer",
      title: "Herman Doomer (ca. 1595–1650)",
      artistId: "rembrandt",
      year: "1640",
      medium: "Oil on wood",
      genre: "portrait",
      museumId: "met",
      galleryRoom: "Room 616",
      patron: "Herman Doomer (subject/commissioner)",
      provenance: "Portrait of the Amsterdam ebony worker Herman Doomer. Acquired by the Metropolitan Museum of Art, H. O. Havemeyer Collection, 1929.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP145921.jpg"
    },
    {
      id: "rembrandt-man-magnifying",
      title: "Man with a Magnifying Glass",
      artistId: "rembrandt",
      year: "c. 1660",
      medium: "Oil on canvas",
      genre: "portrait",
      museumId: "met",
      galleryRoom: "Room 616",
      patron: "Unknown (private commission)",
      provenance: "Companion piece to Woman with a Pink. Acquired by the Metropolitan Museum of Art, Bequest of Benjamin Altman, 1913.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP145909.jpg"
    },
    // === HOKUSAI ===
    {
      id: "hokusai-wave",
      title: "The Great Wave off Kanagawa",
      artistId: "hokusai",
      year: "c. 1831",
      medium: "Woodblock print (nishiki-e)",
      genre: "ukiyo-e",
      museumId: "met",
      galleryRoom: "Gallery 231",
      patron: "Nishimuraya Yohachi (publisher)",
      provenance: "Part of the series Thirty-six Views of Mount Fuji. This impression acquired by the Metropolitan Museum of Art, H. O. Havemeyer Collection, 1929.",
      image: "https://images.metmuseum.org/CRDImages/as/web-large/DP130155.jpg"
    },
    {
      id: "hokusai-wave-2",
      title: "The Great Wave off Kanagawa (second impression)",
      artistId: "hokusai",
      year: "c. 1831",
      medium: "Woodblock print (nishiki-e)",
      genre: "ukiyo-e",
      museumId: "artic",
      galleryRoom: "Gallery 107",
      patron: "Nishimuraya Yohachi (publisher)",
      provenance: "Part of the series Thirty-six Views of Mount Fuji. Acquired by the Art Institute of Chicago, Clarence Buckingham Collection.",
      image: "https://www.artic.edu/iiif/2/b3974542-b9b4-7568-fc4b-966738f61d78/full/400,/0/default.jpg"
    },
    // === RENOIR ===
    {
      id: "renoir-two-sisters",
      title: "Two Sisters (On the Terrace)",
      artistId: "renoir",
      year: "1881",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "artic",
      galleryRoom: "Gallery 201",
      patron: "Paul Durand-Ruel (dealer/buyer)",
      provenance: "Painted at the Maison Fournaise restaurant in Chatou. Acquired by the Art Institute of Chicago, Mr. and Mrs. Lewis Larned Coburn Memorial Collection.",
      image: "https://www.artic.edu/iiif/2/3a608f55-d76e-fa96-d0b1-0789fbc48f1e/full/400,/0/default.jpg"
    },
    {
      id: "renoir-acrobats",
      title: "Acrobats at the Cirque Fernando",
      artistId: "renoir",
      year: "1879",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "artic",
      galleryRoom: "Gallery 201",
      patron: "Self-funded (exhibited independently)",
      provenance: "Depicts Francisca and Angelina Wartenberg performing at the Cirque Fernando in Montmartre. Acquired by the Art Institute of Chicago, Potter Palmer Collection.",
      image: "https://www.artic.edu/iiif/2/321c45f5-22a3-84a2-44cc-cf66642d4cf2/full/400,/0/default.jpg"
    },
    {
      id: "renoir-charpentier",
      title: "Madame Charpentier and Her Children",
      artistId: "renoir",
      year: "1878",
      medium: "Oil on canvas",
      genre: "portrait",
      museumId: "met",
      galleryRoom: "Room 824",
      patron: "Georges Charpentier (publisher, commissioner)",
      provenance: "Commissioned by publisher Georges Charpentier. Exhibited at the Salon of 1879 to great acclaim. Acquired by the Metropolitan Museum of Art, Catharine Lorillard Wolfe Collection, 1907.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP-35674-001.jpg"
    },
    // === DEGAS ===
    {
      id: "degas-dance-class",
      title: "The Dance Class",
      artistId: "degas",
      year: "1874",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "met",
      galleryRoom: "Room 815",
      patron: "Jean-Baptiste Faure (opera singer, collector)",
      provenance: "Commissioned by Jean-Baptiste Faure. Acquired by the Metropolitan Museum of Art, Bequest of Mrs. Harry Payne Bingham, 1986.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP-20101-001.jpg"
    },
    // === SEURAT ===
    {
      id: "seurat-grande-jatte",
      title: "A Sunday on La Grande Jatte — 1884",
      artistId: "seurat",
      year: "1884–1886",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "artic",
      galleryRoom: "Gallery 240",
      patron: "Self-funded (exhibited at Impressionist show)",
      provenance: "Exhibited at the eighth and final Impressionist exhibition in 1886. Acquired by the Art Institute of Chicago, Helen Birch Bartlett Memorial Collection, 1926.",
      image: "https://www.artic.edu/iiif/2/2d484387-2509-5e8e-2c43-22f9981972eb/full/400,/0/default.jpg"
    },
    // === CAILLEBOTTE ===
    {
      id: "caillebotte-paris-street",
      title: "Paris Street; Rainy Day",
      artistId: "caillebotte",
      year: "1877",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "artic",
      galleryRoom: "Gallery 201",
      patron: "Self-funded (independently wealthy)",
      provenance: "Exhibited at the third Impressionist exhibition in 1877. Acquired by the Art Institute of Chicago, Charles H. and Mary F. S. Worcester Collection, 1964.",
      image: "https://www.artic.edu/iiif/2/f8fd76e9-c396-5678-36ed-6a348c904d27/full/400,/0/default.jpg"
    },
    // === CASSATT ===
    {
      id: "cassatt-childs-bath",
      title: "The Child's Bath",
      artistId: "cassatt",
      year: "1893",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "artic",
      galleryRoom: "Gallery 273",
      patron: "Self-funded (independently wealthy)",
      provenance: "One of Cassatt's most celebrated works. Acquired by the Art Institute of Chicago, Robert A. Waller Fund, 1910.",
      image: "https://www.artic.edu/iiif/2/3b885ae0-4d46-5fe4-d70a-00474827f02c/full/400,/0/default.jpg"
    },
    // === HOPPER ===
    {
      id: "hopper-nighthawks",
      title: "Nighthawks",
      artistId: "hopper",
      year: "1942",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "artic",
      galleryRoom: "Gallery 262",
      patron: "Friends of American Art (acquisition fund)",
      provenance: "Purchased by the Art Institute of Chicago within months of its completion in 1942. Friends of American Art Collection.",
      image: "https://www.artic.edu/iiif/2/831a05de-d3f6-f4fa-a460-23008dd58dda/full/400,/0/default.jpg"
    },
    // === CARAVAGGIO ===
    {
      id: "caravaggio-denial-peter",
      title: "The Denial of Saint Peter",
      artistId: "caravaggio",
      year: "1610",
      medium: "Oil on canvas",
      genre: "religious",
      museumId: "met",
      galleryRoom: "Room 620",
      patron: "Unknown (likely church commission)",
      provenance: "One of Caravaggio's last paintings. Acquired by the Metropolitan Museum of Art, Gift of Herman and Lila Grunebaum, 1997.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP-12413-001.jpg"
    },
    // === GAUGUIN ===
    {
      id: "gauguin-ia-orana",
      title: "Ia Orana Maria (Hail Mary)",
      artistId: "gauguin",
      year: "1891",
      medium: "Oil on canvas",
      genre: "religious",
      museumId: "met",
      galleryRoom: "Room 825",
      patron: "Self-funded (painted in Tahiti)",
      provenance: "Painted during Gauguin's first trip to Tahiti. He considered it his finest Tahitian work. Acquired by the Metropolitan Museum of Art, Bequest of Sam A. Lewisohn, 1951.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DT1025.jpg"
    },
    // === MANET ===
    {
      id: "manet-monet-garden",
      title: "The Monet Family in Their Garden at Argenteuil",
      artistId: "manet",
      year: "1874",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "met",
      galleryRoom: "Room 810",
      patron: "Self-funded (personal work)",
      provenance: "Painted during a visit to Monet at Argenteuil. Acquired by the Metropolitan Museum of Art, Bequest of Joan Whitney Payson, 1975.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP-25465-001.jpg"
    },
    {
      id: "manet-young-lady",
      title: "Young Lady in 1866",
      artistId: "manet",
      year: "1866",
      medium: "Oil on canvas",
      genre: "portrait",
      museumId: "met",
      galleryRoom: "Room 810",
      patron: "Self-funded (personal work)",
      provenance: "Depicts Victorine Meurent, Manet's favorite model. Acquired by the Metropolitan Museum of Art, Gift of Erwin Davis, 1889.",
      image: "https://images.metmuseum.org/CRDImages/ep/web-large/DP273977.jpg"
    }
  ],
  genres: {
    "portrait": { label: "Portraiture", related: ["genre-painting", "religious"] },
    "landscape": { label: "Landscape", related: ["ukiyo-e", "genre-painting"] },
    "genre-painting": { label: "Genre Painting", related: ["portrait", "interior", "landscape"] },
    "still-life": { label: "Still Life", related: ["landscape", "interior"] },
    "interior": { label: "Interior Scene", related: ["genre-painting", "still-life"] },
    "religious": { label: "Religious", related: ["portrait", "genre-painting"] },
    "ukiyo-e": { label: "Ukiyo-e", related: ["landscape", "genre-painting"] }
  },

  // Starting pairs for the gallery entrance
  startingPairs: [
    ["vermeer-study-young-woman", "hokusai-wave"],
    ["vangogh-wheat-cypresses", "renoir-two-sisters"],
    ["rembrandt-aristotle", "monet-water-lilies"],
    ["hopper-nighthawks", "seurat-grande-jatte"],
    ["caillebotte-paris-street", "vangogh-self-portrait-hat"],
    ["degas-dance-class", "cassatt-childs-bath"]
  ],

  // ── Deep connection metadata ──
  // Themes, depicted locations, techniques, color palettes, collectors
  artworkMeta: {
    "vermeer-water-pitcher": {
      themes: ["domestic life", "woman", "light", "solitude"],
      depictedLocation: "Interior, Delft",
      technique: "sfumato",
      palette: "cool",
      collectors: ["Henry Marquand"]
    },
    "vermeer-study-young-woman": {
      themes: ["portrait", "woman", "mystery", "light"],
      depictedLocation: "Interior, Delft",
      technique: "sfumato",
      palette: "cool",
      collectors: ["Rodolphe Kann", "Benjamin Altman"]
    },
    "vermeer-young-woman-lute": {
      themes: ["music", "woman", "domestic life", "light"],
      depictedLocation: "Interior, Delft",
      technique: "sfumato",
      palette: "warm",
      collectors: ["Collis P. Huntington"]
    },
    "monet-water-lilies": {
      themes: ["water", "nature", "garden", "reflection"],
      depictedLocation: "Giverny, France",
      technique: "plein air",
      palette: "cool",
      collectors: ["Paul Durand-Ruel"]
    },
    "monet-water-lily-pond": {
      themes: ["water", "nature", "garden", "bridge"],
      depictedLocation: "Giverny, France",
      technique: "plein air",
      palette: "cool",
      collectors: []
    },
    "monet-normandy-train": {
      themes: ["urban life", "technology", "steam", "modernity"],
      depictedLocation: "Gare Saint-Lazare, Paris",
      technique: "plein air",
      palette: "warm",
      collectors: []
    },
    "monet-stacks-wheat": {
      themes: ["nature", "seasons", "rural life", "light"],
      depictedLocation: "Giverny, France",
      technique: "plein air",
      palette: "warm",
      collectors: []
    },
    "monet-beach-sainte-adresse": {
      themes: ["water", "coast", "leisure", "nature"],
      depictedLocation: "Sainte-Adresse, Normandy",
      technique: "plein air",
      palette: "cool",
      collectors: []
    },
    "vangogh-wheat-cypresses": {
      themes: ["nature", "landscape", "wind", "sky"],
      depictedLocation: "Saint-Rémy-de-Provence, France",
      technique: "impasto",
      palette: "warm",
      collectors: ["Annenberg Foundation"]
    },
    "vangogh-self-portrait-hat": {
      themes: ["self-portrait", "identity", "artist"],
      depictedLocation: "Paris, France",
      technique: "impasto",
      palette: "warm",
      collectors: ["Adelaide Milton de Groot"]
    },
    "vangogh-irises": {
      themes: ["nature", "flowers", "color", "garden"],
      depictedLocation: "Saint-Rémy-de-Provence, France",
      technique: "impasto",
      palette: "cool",
      collectors: ["Adele R. Levy"]
    },
    "vangogh-sunflowers": {
      themes: ["nature", "flowers", "still life", "color"],
      depictedLocation: "Paris, France",
      technique: "impasto",
      palette: "warm",
      collectors: []
    },
    "vangogh-cypresses": {
      themes: ["nature", "landscape", "trees", "sky"],
      depictedLocation: "Saint-Rémy-de-Provence, France",
      technique: "impasto",
      palette: "earth",
      collectors: []
    },
    "vangogh-oleanders": {
      themes: ["nature", "flowers", "still life", "color"],
      depictedLocation: "Arles, France",
      technique: "impasto",
      palette: "warm",
      collectors: ["John L. Loeb"]
    },
    "vangogh-bedroom": {
      themes: ["domestic life", "interior", "solitude", "personal"],
      depictedLocation: "Arles, France",
      technique: "impasto",
      palette: "cool",
      collectors: ["Helen Birch Bartlett"]
    },
    "vangogh-self-portrait-artic": {
      themes: ["self-portrait", "identity", "artist"],
      depictedLocation: "Paris, France",
      technique: "impasto",
      palette: "cool",
      collectors: ["Joseph Winterbotham"]
    },
    "vangogh-first-steps": {
      themes: ["family", "rural life", "childhood", "tenderness"],
      depictedLocation: "Saint-Rémy-de-Provence, France",
      technique: "impasto",
      palette: "earth",
      collectors: ["George N. Richard"]
    },
    "vangogh-olive-trees": {
      themes: ["nature", "landscape", "trees", "light"],
      depictedLocation: "Saint-Rémy-de-Provence, France",
      technique: "impasto",
      palette: "earth",
      collectors: ["Walter H. Annenberg"]
    },
    "rembrandt-aristotle": {
      themes: ["philosophy", "portrait", "contemplation", "classical"],
      depictedLocation: "Imagined classical setting",
      technique: "chiaroscuro",
      palette: "warm",
      collectors: ["Don Antonio Ruffo", "Alfred W. Erickson"]
    },
    "rembrandt-self-portrait": {
      themes: ["self-portrait", "identity", "artist", "aging"],
      depictedLocation: "Amsterdam, Dutch Republic",
      technique: "chiaroscuro",
      palette: "warm",
      collectors: ["Benjamin Altman"]
    },
    "rembrandt-hendrickje": {
      themes: ["portrait", "woman", "love", "intimacy"],
      depictedLocation: "Amsterdam, Dutch Republic",
      technique: "chiaroscuro",
      palette: "warm",
      collectors: ["Archer M. Huntington"]
    },
    "rembrandt-herman-doomer": {
      themes: ["portrait", "craftsman", "character"],
      depictedLocation: "Amsterdam, Dutch Republic",
      technique: "chiaroscuro",
      palette: "earth",
      collectors: ["H. O. Havemeyer"]
    },
    "rembrandt-man-magnifying": {
      themes: ["portrait", "mystery", "scholarly"],
      depictedLocation: "Amsterdam, Dutch Republic",
      technique: "chiaroscuro",
      palette: "earth",
      collectors: ["Benjamin Altman"]
    },
    "hokusai-wave": {
      themes: ["water", "nature", "power", "mountain"],
      depictedLocation: "Kanagawa, Japan (view of Mt. Fuji)",
      technique: "woodblock printing",
      palette: "cool",
      collectors: ["H. O. Havemeyer"]
    },
    "hokusai-wave-2": {
      themes: ["water", "nature", "power", "mountain"],
      depictedLocation: "Kanagawa, Japan (view of Mt. Fuji)",
      technique: "woodblock printing",
      palette: "cool",
      collectors: ["Clarence Buckingham"]
    },
    "renoir-two-sisters": {
      themes: ["family", "woman", "leisure", "garden"],
      depictedLocation: "Chatou, France",
      technique: "plein air",
      palette: "warm",
      collectors: ["Lewis Larned Coburn"]
    },
    "renoir-acrobats": {
      themes: ["performance", "childhood", "circus", "spectacle"],
      depictedLocation: "Cirque Fernando, Montmartre, Paris",
      technique: "plein air",
      palette: "warm",
      collectors: ["Potter Palmer"]
    },
    "renoir-charpentier": {
      themes: ["family", "portrait", "woman", "children", "wealth"],
      depictedLocation: "Charpentier residence, Paris",
      technique: "glazing",
      palette: "warm",
      collectors: ["Georges Charpentier", "Catharine Lorillard Wolfe"]
    },
    "degas-dance-class": {
      themes: ["dance", "performance", "practice", "woman"],
      depictedLocation: "Paris Opera, Paris",
      technique: "unusual angles",
      palette: "warm",
      collectors: ["Jean-Baptiste Faure", "Mrs. Harry Payne Bingham"]
    },
    "seurat-grande-jatte": {
      themes: ["leisure", "urban life", "park", "society"],
      depictedLocation: "Île de la Grande Jatte, Seine, Paris",
      technique: "pointillism",
      palette: "cool",
      collectors: ["Helen Birch Bartlett"]
    },
    "caillebotte-paris-street": {
      themes: ["urban life", "rain", "modernity", "architecture"],
      depictedLocation: "Place de Dublin, Paris",
      technique: "photographic perspective",
      palette: "cool",
      collectors: ["Charles H. Worcester"]
    },
    "cassatt-childs-bath": {
      themes: ["mother and child", "domestic life", "tenderness", "woman"],
      depictedLocation: "Interior, France",
      technique: "Japanese influence",
      palette: "warm",
      collectors: ["Robert A. Waller"]
    },
    "hopper-nighthawks": {
      themes: ["urban life", "solitude", "night", "modernity", "alienation"],
      depictedLocation: "Greenwich Village, New York City",
      technique: "realism",
      palette: "cool",
      collectors: ["Friends of American Art"]
    },
    "caravaggio-denial-peter": {
      themes: ["religion", "betrayal", "drama", "light"],
      depictedLocation: "Biblical scene",
      technique: "tenebrism",
      palette: "earth",
      collectors: ["Herman Grunebaum"]
    },
    "gauguin-ia-orana": {
      themes: ["religion", "tropical", "paradise", "woman"],
      depictedLocation: "Tahiti, French Polynesia",
      technique: "synthetism",
      palette: "warm",
      collectors: ["Sam A. Lewisohn"]
    },
    "manet-monet-garden": {
      themes: ["garden", "family", "leisure", "friendship"],
      depictedLocation: "Argenteuil, France",
      technique: "alla prima",
      palette: "warm",
      collectors: ["Joan Whitney Payson"]
    },
    "manet-young-lady": {
      themes: ["portrait", "woman", "fashion", "modernity"],
      depictedLocation: "Paris, France",
      technique: "alla prima",
      palette: "cool",
      collectors: ["Erwin Davis"]
    }
  },

  // Exhibition connections — works shown together
  exhibitions: [
    { name: "3rd Impressionist Exhibition, 1877", artworks: ["monet-normandy-train", "caillebotte-paris-street", "renoir-acrobats"] },
    { name: "8th Impressionist Exhibition, 1886", artworks: ["seurat-grande-jatte", "cassatt-childs-bath"] }
  ]
};
