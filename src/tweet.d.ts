export interface Tweet {
  bookmark_count: number;
  bookmarked: boolean;
  conversation_id_str: string;
  display_text_range: number[];
  entities: Entities;
  favorite_count: number;
  favorited: boolean;
  full_text: string;
  is_quote_status: boolean;
  lang: string;
  possibly_sensitive: boolean;
  possibly_sensitive_editable: boolean;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  retweeted: boolean;
  id_str: string;
  edit_control: EditControl;
  is_translatable: boolean;
  has_super_follower: boolean;
  source: string;
  user: User;
  views: Views;
  extended_entities: ExtendedEntities;
  text: string;
  created_at: string;
  source_name: string;
  source_url: string;
  permalink: string;
}

export interface Entities {
  hashtags: any[];
  media: Medum[];
  symbols: any[];
  timestamps: any[];
  urls: any[];
  user_mentions: any[];
}

export interface Medum {
  display_url: string;
  expanded_url: string;
  id_str: string;
  indices: number[];
  media_key: string;
  media_url_https: string;
  type: string;
  url: string;
  ext_media_availability: ExtMediaAvailability;
  features: Features;
  sizes: Sizes;
  original_info: OriginalInfo;
  media_results: MediaResults;
}

export interface ExtMediaAvailability {
  status: string;
}

export interface Features {
  large: Large;
  medium: Medium;
  small: Small;
  orig: Orig;
}

export interface Large {
  faces: Face[];
}

export interface Face {
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface Medium {
  faces: Face2[];
}

export interface Face2 {
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface Small {
  faces: Face3[];
}

export interface Face3 {
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface Orig {
  faces: Face4[];
}

export interface Face4 {
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface Sizes {
  large: Large2;
  medium: Medium2;
  small: Small2;
  thumb: Thumb;
}

export interface Large2 {
  h: number;
  w: number;
  resize: string;
}

export interface Medium2 {
  h: number;
  w: number;
  resize: string;
}

export interface Small2 {
  h: number;
  w: number;
  resize: string;
}

export interface Thumb {
  h: number;
  w: number;
  resize: string;
}

export interface OriginalInfo {
  height: number;
  width: number;
  focus_rects: FocusRect[];
}

export interface FocusRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MediaResults {
  result: Result;
}

export interface Result {
  media_key: string;
}

export interface EditControl {
  edit_tweet_ids: string[];
  editable_until_msecs: string;
  is_edit_eligible: boolean;
  edits_remaining: string;
}

export interface User {
  following: boolean;
  can_dm: boolean;
  can_media_tag: boolean;
  default_profile: boolean;
  default_profile_image: boolean;
  description: string;
  entities: Entities2;
  fast_followers_count: number;
  favourites_count: number;
  followers_count: number;
  friends_count: number;
  has_custom_timelines: boolean;
  is_translator: boolean;
  listed_count: number;
  location: string;
  media_count: number;
  name: string;
  normal_followers_count: number;
  pinned_tweet_ids_str: any[];
  possibly_sensitive: boolean;
  profile_banner_url: string;
  profile_image_url_https: string;
  profile_interstitial_type: string;
  screen_name: string;
  statuses_count: number;
  translator_type: string;
  url: string;
  verified: boolean;
  want_retweets: boolean;
  withheld_in_countries: any[];
  id_str: string;
  profile_image_shape: string;
  is_blue_verified: boolean;
  tipjar_settings: TipjarSettings;
  has_graduated_access: boolean;
  created_at: string;
}

export interface Entities2 {
  description: Description;
  url: Url;
}

export interface Description {
  urls: any[];
}

export interface Url {
  urls: Url2[];
}

export interface Url2 {
  display_url: string;
  expanded_url: string;
  url: string;
  indices: number[];
}

export interface TipjarSettings {}

export interface Views {
  count: number;
  state: string;
}

export interface ExtendedEntities {
  media: Medum2[];
}

export interface Medum2 {
  display_url: string;
  expanded_url: string;
  id_str: string;
  indices: number[];
  media_key: string;
  media_url_https: string;
  type: string;
  url: string;
  ext_media_availability: ExtMediaAvailability2;
  features: Features2;
  sizes: Sizes2;
  original_info: OriginalInfo2;
  media_results: MediaResults2;
}

export interface ExtMediaAvailability2 {
  status: string;
}

export interface Features2 {
  large: Large3;
  medium: Medium3;
  small: Small3;
  orig: Orig2;
}

export interface Large3 {
  faces: Face5[];
}

export interface Face5 {
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface Medium3 {
  faces: Face6[];
}

export interface Face6 {
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface Small3 {
  faces: Face7[];
}

export interface Face7 {
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface Orig2 {
  faces: Face8[];
}

export interface Face8 {
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface Sizes2 {
  large: Large4;
  medium: Medium4;
  small: Small4;
  thumb: Thumb2;
}

export interface Large4 {
  h: number;
  w: number;
  resize: string;
}

export interface Medium4 {
  h: number;
  w: number;
  resize: string;
}

export interface Small4 {
  h: number;
  w: number;
  resize: string;
}

export interface Thumb2 {
  h: number;
  w: number;
  resize: string;
}

export interface OriginalInfo2 {
  height: number;
  width: number;
  focus_rects: FocusRect2[];
}

export interface FocusRect2 {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MediaResults2 {
  result: Result2;
}

export interface Result2 {
  media_key: string;
}
