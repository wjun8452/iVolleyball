
export interface PlaceInfo {
  /** 比赛地点经纬度 */
  latlon: {latitude: number, longitude: number},
  /** 比赛地点 */
  place: string,
  /** 比赛城市 */
  city: string,
}