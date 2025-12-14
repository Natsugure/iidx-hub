import { ChartBase } from "./chart.types";

export interface SongBase {
  id: string;
  title: string;
  genre: string;
  artist: string;
  version: number;
}

export interface SongWithCharts extends SongBase {
  charts: ChartBase[];
}