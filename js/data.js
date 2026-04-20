// Art database — real works from major museums
// Images use Wikimedia Commons (public domain)
const ART_DB = {
  artists: {
    "vermeer": {
      name: "Johannes Vermeer",
      born: "1632, Delft, Dutch Republic",
      died: "1675, Delft, Dutch Republic",
      bio: "Dutch Golden Age painter who specialized in domestic interior scenes of middle-class life. Known for his masterful treatment of light and meticulous composition. Only about 34 paintings are attributed to him.",
      contact: "Historical artist (1632–1675) — no living contact. Estate represented by the Vermeer Centre Delft, Voldersgracht 21, 2611 EV Delft, Netherlands."
    },
    "monet": {
      name: "Claude Monet",
      born: "1840, Paris, France",
      died: "1926, Giverny, France",
      bio: "Founder of French Impressionist painting. His practice of plein air landscape painting was a radical departure from tradition. His ambition to document the French countryside led him to adopt a method of painting the same scene many times to capture the changing of light and seasons.",
      contact: "Historical artist (1840–1926) — no living contact. Foundation Claude Monet, 84 Rue Claude Monet, 27620 Giverny, France."
    },
    "vangogh": {
      name: "Vincent van Gogh",
      born: "1853, Zundert, Netherlands",
      died: "1890, Auvers-sur-Oise, France",
      bio: "Post-Impressionist painter whose work had a far-reaching influence on 20th-century art. In a decade he created about 2,100 artworks, including around 860 oil paintings. His bold colors and dramatic, expressive brushwork contributed to the foundations of modern art.",
      contact: "Historical artist (1853–1890) — no living contact. Van Gogh Museum, Museumplein 6, 1071 DJ Amsterdam, Netherlands."
    },
    "rembrandt": {
      name: "Rembrandt van Rijn",
      born: "1606, Leiden, Dutch Republic",
      died: "1669, Amsterdam, Dutch Republic",
      bio: "Dutch Golden Age painter and printmaker. An innovative and prolific master in three media, he is generally considered one of the greatest visual artists in the history of art. His works depict a range of style and subject matter, from portraits to landscapes, and from biblical to mythological scenes.",
      contact: "Historical artist (1606–1669) — no living contact. Rembrandt House Museum, Jodenbreestraat 4, 1011 NK Amsterdam, Netherlands."
    },
    "klimt": {
      name: "Gustav Klimt",
      born: "1862, Baumgarten, Austrian Empire",
      died: "1918, Vienna, Austria-Hungary",
      bio: "Austrian symbolist painter and one of the most prominent members of the Vienna Secession movement. Known for his paintings, murals, sketches, and other objets d'art, primarily distinguished by his use of gold leaf and elaborate decorative patterns.",
      contact: "Historical artist (1862–1918) — no living contact. Klimt Foundation, Feldmühlgasse 15, 1130 Vienna, Austria."
    },
    "hokusai": {
      name: "Katsushika Hokusai",
      born: "1760, Edo (Tokyo), Japan",
      died: "1849, Edo (Tokyo), Japan",
      bio: "Japanese ukiyo-e artist of the Edo period, active as a painter and printmaker. Achieved international fame with the woodblock print series Thirty-six Views of Mount Fuji, which includes the iconic print The Great Wave off Kanagawa.",
      contact: "Historical artist (1760–1849) — no living contact. Sumida Hokusai Museum, 2-7-2 Kamezawa, Sumida City, Tokyo 130-0014, Japan."
    },
    "daVinci": {
      name: "Leonardo da Vinci",
      born: "1452, Vinci, Republic of Florence",
      died: "1519, Amboise, Kingdom of France",
      bio: "Italian polymath of the High Renaissance who was active as a painter, draughtsman, engineer, scientist, theorist, sculptor, and architect. His genius epitomized the Renaissance humanist ideal, and his collective works compose a contribution to later generations of artists.",
      contact: "Historical artist (1452–1519) — no living contact. Museo Leonardiano, Piazza dei Conti Guidi, 50059 Vinci FI, Italy."
    },
    "renoir": {
      name: "Pierre-Auguste Renoir",
      born: "1841, Limoges, France",
      died: "1919, Cagnes-sur-Mer, France",
      bio: "French Impressionist painter who celebrated beauty and feminine sensuality. He was a leading painter in the development of the Impressionist style, known for his vibrant light and saturated color, most often focusing on people in intimate and candid compositions.",
      contact: "Historical artist (1841–1919) — no living contact. Musée Renoir, Chemin des Collettes, 06800 Cagnes-sur-Mer, France."
    }
  },
  museums: {
    "rijksmuseum": {
      name: "Rijksmuseum",
      city: "Amsterdam, Netherlands",
      address: "Museumstraat 1, 1071 XX Amsterdam, Netherlands",
      website: "https://www.rijksmuseum.nl"
    },
    "louvre": {
      name: "Musée du Louvre",
      city: "Paris, France",
      address: "Rue de Rivoli, 75001 Paris, France",
      website: "https://www.louvre.fr"
    },
    "orsay": {
      name: "Musée d'Orsay",
      city: "Paris, France",
      address: "1 Rue de la Légion d'Honneur, 75007 Paris, France",
      website: "https://www.musee-orsay.fr"
    },
    "met": {
      name: "The Metropolitan Museum of Art",
      city: "New York, USA",
      address: "1000 Fifth Avenue, New York, NY 10028, USA",
      website: "https://www.metmuseum.org"
    },
    "nationalgallery": {
      name: "National Gallery",
      city: "London, UK",
      address: "Trafalgar Square, London WC2N 5DN, UK",
      website: "https://www.nationalgallery.org.uk"
    },
    "belvedere": {
      name: "Österreichische Galerie Belvedere",
      city: "Vienna, Austria",
      address: "Prinz-Eugen-Straße 27, 1030 Vienna, Austria",
      website: "https://www.belvedere.at"
    },
    "mfa_boston": {
      name: "Museum of Fine Arts, Boston",
      city: "Boston, USA",
      address: "465 Huntington Avenue, Boston, MA 02115, USA",
      website: "https://www.mfa.org"
    },
    "vangogh_museum": {
      name: "Van Gogh Museum",
      city: "Amsterdam, Netherlands",
      address: "Museumplein 6, 1071 DJ Amsterdam, Netherlands",
      website: "https://www.vangoghmuseum.nl"
    },
    "neue_galerie": {
      name: "Neue Galerie New York",
      city: "New York, USA",
      address: "1048 Fifth Avenue, New York, NY 10028, USA",
      website: "https://www.neuegalerie.org"
    },
    "art_institute_chicago": {
      name: "Art Institute of Chicago",
      city: "Chicago, USA",
      address: "111 S Michigan Ave, Chicago, IL 60603, USA",
      website: "https://www.artic.edu"
    },
    "mauritshuis": {
      name: "Mauritshuis",
      city: "The Hague, Netherlands",
      address: "Plein 29, 2511 CS The Hague, Netherlands",
      website: "https://www.mauritshuis.nl"
    }
  },
  artworks: [
    {
      id: "vermeer-girl-pearl",
      title: "Girl with a Pearl Earring",
      artistId: "vermeer",
      year: "c. 1665",
      medium: "Oil on canvas",
      genre: "portrait",
      museumId: "mauritshuis",
      galleryRoom: "Room 15",
      provenance: "Possibly commissioned by Pieter van Ruijven. Sold at auction in The Hague in 1881 for 2 guilders and 30 cents. Donated to the Mauritshuis in 1903 by A.A. des Tombe.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/400px-1665_Girl_with_a_Pearl_Earring.jpg"
    },
    {
      id: "vermeer-milkmaid",
      title: "The Milkmaid",
      artistId: "vermeer",
      year: "c. 1658",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "rijksmuseum",
      galleryRoom: "Gallery of Honour, Room 2.20",
      provenance: "First recorded in the 1696 auction of Jacob Dissius in Amsterdam. Passed through several Dutch collections before being acquired by the Rijksmuseum in 1908.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg/400px-Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg"
    },
    {
      id: "vermeer-art-painting",
      title: "The Art of Painting",
      artistId: "vermeer",
      year: "c. 1666–1668",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "belvedere",
      galleryRoom: "Upper Belvedere, Room 4",
      provenance: "Kept by Vermeer's widow Catharina Bolnes. Acquired by Count Czernin in 1813. Controversially acquired by Adolf Hitler in 1940. Recovered by the Allies and transferred to the Austrian state in 1946.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Johannes_Vermeer_-_The_Art_of_Painting_-_Google_Art_Project.jpg/400px-Johannes_Vermeer_-_The_Art_of_Painting_-_Google_Art_Project.jpg"
    },
    {
      id: "monet-waterlilies",
      title: "Water Lilies",
      artistId: "monet",
      year: "1906",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "art_institute_chicago",
      galleryRoom: "Gallery 243",
      provenance: "Painted at Giverny. Sold by Monet to Durand-Ruel gallery in 1909. Passed through several private collections. Acquired by the Art Institute of Chicago in 1933.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/400px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg"
    },
    {
      id: "monet-impression",
      title: "Impression, Sunrise",
      artistId: "monet",
      year: "1872",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "orsay",
      galleryRoom: "Musée Marmottan Monet (on loan)",
      provenance: "Exhibited at the first Impressionist exhibition in 1874, where it gave the movement its name. Stolen in 1985 from the Marmottan and recovered in 1990.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Monet_-_Impression%2C_Sunrise.jpg/400px-Monet_-_Impression%2C_Sunrise.jpg"
    },
    {
      id: "monet-rouen",
      title: "Rouen Cathedral, West Façade, Sunlight",
      artistId: "monet",
      year: "1894",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "met",
      galleryRoom: "Gallery 819",
      provenance: "Part of a series of 30 paintings of Rouen Cathedral. Acquired by the Metropolitan Museum of Art through the Theodore M. Davis Collection, Bequest of Theodore M. Davis, 1915.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Claude_Monet_-_Rouen_Cathedral%2C_West_Fa%C3%A7ade%2C_Sunlight_-_Google_Art_Project.jpg/400px-Claude_Monet_-_Rouen_Cathedral%2C_West_Fa%C3%A7ade%2C_Sunlight_-_Google_Art_Project.jpg"
    },
    {
      id: "vangogh-starry",
      title: "The Starry Night",
      artistId: "vangogh",
      year: "1889",
      medium: "Oil on canvas",
      genre: "landscape",
      museumId: "met",
      galleryRoom: "MoMA Gallery 502 (on loan from MoMA)",
      provenance: "Painted at the Saint-Paul-de-Mausole asylum in Saint-Rémy-de-Provence. Acquired by Johanna van Gogh-Bonger after Vincent's death. Sold to various collectors. Acquired by MoMA in 1941 through the Lillie P. Bliss Bequest.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/400px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg"
    },
    {
      id: "vangogh-sunflowers",
      title: "Sunflowers",
      artistId: "vangogh",
      year: "1888",
      medium: "Oil on canvas",
      genre: "still-life",
      museumId: "nationalgallery",
      galleryRoom: "Room 43",
      provenance: "Painted in Arles to decorate Gauguin's room. Acquired by the National Gallery in 1924 from the Courtauld Fund.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Vincent_Willem_van_Gogh_127.jpg/400px-Vincent_Willem_van_Gogh_127.jpg"
    },
    {
      id: "vangogh-bedroom",
      title: "The Bedroom",
      artistId: "vangogh",
      year: "1888",
      medium: "Oil on canvas",
      genre: "interior",
      museumId: "vangogh_museum",
      galleryRoom: "Floor 1, Room 1.14",
      provenance: "Painted in the Yellow House in Arles. One of three versions. This version remained with the Van Gogh family and was placed on permanent loan to the Van Gogh Museum.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Vincent_van_Gogh_-_De_slaapkamer_-_Google_Art_Project.jpg/400px-Vincent_van_Gogh_-_De_slaapkamer_-_Google_Art_Project.jpg"
    },
    {
      id: "rembrandt-nightwatch",
      title: "The Night Watch",
      artistId: "rembrandt",
      year: "1642",
      medium: "Oil on canvas",
      genre: "group-portrait",
      museumId: "rijksmuseum",
      galleryRoom: "Gallery of Honour, Night Watch Gallery",
      provenance: "Commissioned by Captain Frans Banninck Cocq and his civic guard. Hung in the Kloveniersdoelen, then Amsterdam Town Hall. Transferred to the Rijksmuseum in 1808.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/The_Night_Watch_-_HD.jpg/400px-The_Night_Watch_-_HD.jpg"
    },
    {
      id: "rembrandt-self-portrait",
      title: "Self-Portrait with Two Circles",
      artistId: "rembrandt",
      year: "c. 1665–1669",
      medium: "Oil on canvas",
      genre: "portrait",
      museumId: "nationalgallery",
      galleryRoom: "Room 24",
      provenance: "Provenance before 1720 unknown. Passed through the Iveagh Bequest. Acquired by Kenwood House, London. Now on display at the National Gallery.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Rembrandt_van_Rijn_-_Self-Portrait_with_Two_Circles.jpg/400px-Rembrandt_van_Rijn_-_Self-Portrait_with_Two_Circles.jpg"
    },
    {
      id: "rembrandt-anatomy",
      title: "The Anatomy Lesson of Dr. Nicolaes Tulp",
      artistId: "rembrandt",
      year: "1632",
      medium: "Oil on canvas",
      genre: "group-portrait",
      museumId: "mauritshuis",
      galleryRoom: "Room 12",
      provenance: "Commissioned by the Amsterdam Guild of Surgeons. Hung in the Waag (weigh house) in Amsterdam. Acquired by the Mauritshuis in 1828.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Rembrandt_-_The_Anatomy_Lesson_of_Dr_Nicolaes_Tulp.jpg/400px-Rembrandt_-_The_Anatomy_Lesson_of_Dr_Nicolaes_Tulp.jpg"
    },
    {
      id: "klimt-kiss",
      title: "The Kiss",
      artistId: "klimt",
      year: "1907–1908",
      medium: "Oil and gold leaf on canvas",
      genre: "symbolism",
      museumId: "belvedere",
      galleryRoom: "Upper Belvedere, Room 3",
      provenance: "Exhibited at the Kunstschau Vienna in 1908. Purchased by the Austrian state gallery (now Belvedere) during the exhibition. Has remained in the collection since.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/400px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg"
    },
    {
      id: "klimt-adele",
      title: "Portrait of Adele Bloch-Bauer I",
      artistId: "klimt",
      year: "1907",
      medium: "Oil, silver, and gold on canvas",
      genre: "portrait",
      museumId: "neue_galerie",
      galleryRoom: "Gallery Floor 2",
      provenance: "Commissioned by Ferdinand Bloch-Bauer. Seized by the Nazis in 1938. Subject of a landmark restitution case. Returned to Maria Altmann in 2006 and sold to Ronald Lauder for the Neue Galerie for $135 million.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Gustav_Klimt_046.jpg/400px-Gustav_Klimt_046.jpg"
    },
    {
      id: "klimt-tree-of-life",
      title: "The Tree of Life",
      artistId: "klimt",
      year: "1909",
      medium: "Tempera, watercolor, gold leaf, silver, chalk, pencil on paper",
      genre: "symbolism",
      museumId: "belvedere",
      galleryRoom: "Design for the Stoclet Frieze — MAK Vienna",
      provenance: "Created as a design for the dining room frieze of the Palais Stoclet in Brussels. The working drawings are held by the MAK (Museum of Applied Arts) in Vienna.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Gustav_Klimt_-_Der_Lebensbaum.jpg/400px-Gustav_Klimt_-_Der_Lebensbaum.jpg"
    },
    {
      id: "hokusai-wave",
      title: "The Great Wave off Kanagawa",
      artistId: "hokusai",
      year: "c. 1831",
      medium: "Woodblock print (nishiki-e)",
      genre: "ukiyo-e",
      museumId: "met",
      galleryRoom: "Gallery 231",
      provenance: "Part of the series Thirty-six Views of Mount Fuji. Multiple impressions exist worldwide. This impression acquired by the Metropolitan Museum of Art, H. O. Havemeyer Collection, 1929.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/400px-Tsunami_by_hokusai_19th_century.jpg"
    },
    {
      id: "hokusai-fuji-red",
      title: "Fine Wind, Clear Morning (Red Fuji)",
      artistId: "hokusai",
      year: "c. 1831",
      medium: "Woodblock print (nishiki-e)",
      genre: "ukiyo-e",
      museumId: "mfa_boston",
      galleryRoom: "Art of Asia Gallery",
      provenance: "Part of the Thirty-six Views of Mount Fuji series. This impression from the William Sturgis Bigelow Collection, donated to the Museum of Fine Arts, Boston in 1911.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Katsushika_Hokusai_-_Fine_Wind%2C_Clear_Morning_%28Gaif%C5%AB_kaisei%29_-_Google_Art_Project.jpg/400px-Katsushika_Hokusai_-_Fine_Wind%2C_Clear_Morning_%28Gaif%C5%AB_kaisei%29_-_Google_Art_Project.jpg"
    },
    {
      id: "davinci-mona-lisa",
      title: "Mona Lisa",
      artistId: "daVinci",
      year: "c. 1503–1519",
      medium: "Oil on poplar panel",
      genre: "portrait",
      museumId: "louvre",
      galleryRoom: "Salle des États, Room 711",
      provenance: "Believed to depict Lisa Gherardini. Acquired by King Francis I of France. Part of the French royal collection, then the Louvre since 1797. Briefly stolen by Vincenzo Peruggia in 1911 and recovered in 1913.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/400px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg"
    },
    {
      id: "davinci-lady-ermine",
      title: "Lady with an Ermine",
      artistId: "daVinci",
      year: "c. 1489–1490",
      medium: "Oil on walnut panel",
      genre: "portrait",
      museumId: "nationalgallery",
      galleryRoom: "Czartoryski Museum, Kraków (on loan)",
      provenance: "Depicts Cecilia Gallerani, mistress of Ludovico Sforza. Acquired by the Czartoryski family in 1798. Seized by Nazis in 1939, recovered in 1945. Purchased by the Polish government in 2016 for €100 million.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Lady_with_an_Ermine_-_Leonardo_da_Vinci_-_Google_Art_Project.jpg/400px-Lady_with_an_Ermine_-_Leonardo_da_Vinci_-_Google_Art_Project.jpg"
    },
    {
      id: "renoir-moulin",
      title: "Bal du moulin de la Galette",
      artistId: "renoir",
      year: "1876",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "orsay",
      galleryRoom: "Gallery 32, Level 5",
      provenance: "Exhibited at the third Impressionist exhibition in 1877. Acquired by Gustave Caillebotte. Bequeathed to the French state in 1894. Transferred to the Musée d'Orsay in 1986.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Pierre-Auguste_Renoir%2C_Le_Moulin_de_la_Galette.jpg/400px-Pierre-Auguste_Renoir%2C_Le_Moulin_de_la_Galette.jpg"
    },
    {
      id: "renoir-luncheon",
      title: "Luncheon of the Boating Party",
      artistId: "renoir",
      year: "1881",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "met",
      galleryRoom: "The Phillips Collection, Washington D.C.",
      provenance: "Painted at the Maison Fournaise restaurant in Chatou. Purchased by Paul Durand-Ruel in 1881. Acquired by Duncan Phillips in 1923 for $125,000.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pierre-Auguste_Renoir_-_Luncheon_of_the_Boating_Party_-_Google_Art_Project.jpg/400px-Pierre-Auguste_Renoir_-_Luncheon_of_the_Boating_Party_-_Google_Art_Project.jpg"
    },
    {
      id: "renoir-swing",
      title: "The Swing",
      artistId: "renoir",
      year: "1876",
      medium: "Oil on canvas",
      genre: "genre-painting",
      museumId: "orsay",
      galleryRoom: "Gallery 32, Level 5",
      provenance: "Painted in the garden of Renoir's studio in Montmartre. Part of the Caillebotte bequest to the French state in 1894. Transferred to the Musée d'Orsay in 1986.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Auguste_Renoir_-_The_Swing_-_Google_Art_Project.jpg/400px-Auguste_Renoir_-_The_Swing_-_Google_Art_Project.jpg"
    }
  ],
  genres: {
    "portrait": { label: "Portraiture", related: ["genre-painting", "symbolism"] },
    "landscape": { label: "Landscape", related: ["ukiyo-e", "genre-painting"] },
    "genre-painting": { label: "Genre Painting", related: ["portrait", "interior"] },
    "still-life": { label: "Still Life", related: ["landscape", "interior"] },
    "interior": { label: "Interior Scene", related: ["genre-painting", "still-life"] },
    "group-portrait": { label: "Group Portrait", related: ["portrait", "genre-painting"] },
    "symbolism": { label: "Symbolism", related: ["portrait", "landscape"] },
    "ukiyo-e": { label: "Ukiyo-e", related: ["landscape", "genre-painting"] }
  },

  // Starting pairs for the gallery entrance
  startingPairs: [
    ["vermeer-girl-pearl", "klimt-kiss"],
    ["vangogh-starry", "hokusai-wave"],
    ["davinci-mona-lisa", "rembrandt-nightwatch"],
    ["monet-waterlilies", "renoir-moulin"]
  ]
};
