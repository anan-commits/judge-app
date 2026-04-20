import type { Gender } from "../auth/types";

export function getGenderColor(gender?: Gender) {
  switch (gender) {
    case "male":
      return "bg-blue-100 text-blue-500";
    case "female":
      return "bg-pink-100 text-pink-500";
    case "other":
      return "bg-green-100 text-green-500";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

export function getGenderLabel(gender?: Gender) {
  if (gender === "male") return "男性";
  if (gender === "female") return "女性";
  if (gender === "other") return "その他";
  return "未設定";
}
