import express from "express";
import { KMR } from "koalanlp/API";
import { Tagger } from "koalanlp/proc";
import { Op } from "sequelize";
import { HasMany } from "sequelize-typescript";
import { Keyword } from "../models/Keyword";
import { Link } from "../models/Link";
const router = express.Router();

router.get("/", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json();
  }
  const tagger = new Tagger(KMR);
  const tagged = await tagger(q);
  const searchKeywords: Set<string> = new Set();
  for (const sent of tagged) {
    for (const word of sent._items) {
      for (const morpheme of word._items) {
        if (
          morpheme._tag === "NNG" ||
          morpheme._tag === "NNP" ||
          morpheme._tag === "NNB" ||
          morpheme._tag === "NP" ||
          morpheme._tag === "NR" ||
          morpheme._tag === "VV" ||
          morpheme._tag === "SL"
        ) {
          const keyword = morpheme._surface.toLowerCase();
          searchKeywords.add(keyword);
        }
      }
    }
  }
  const keywords = await Keyword.findAll({
    where: {
      name: {
        [Op.in]: Array.from(searchKeywords.values()),
      },
    },
    include: [Link],
  });
  return res.status(200).json(keywords);
});

export default router;
