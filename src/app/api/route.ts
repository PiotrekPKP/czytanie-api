import { NextRequest } from "next/server";
import { parse } from "node-html-parser";

export async function GET(request: NextRequest) {
  const urlDateParam = request.nextUrl.searchParams.get("date");

  const currentDate = new Date();
  const timezoneOffset = currentDate.getTimezoneOffset();
  currentDate.setMinutes(currentDate.getMinutes() - timezoneOffset);

  const url = `https://mateusz.pl/czytania/${currentDate.getFullYear()}/${
    !urlDateParam
      ? currentDate.toISOString().split("T")[0].replaceAll("-", "")
      : urlDateParam
  }.html`;

  const res = await fetch(url, { cache: "no-cache" });
  const htmlText = await res.text();
  const html = parse(htmlText);

  const sectionWithReadings =
    html.querySelector('a[name="czytania"]')!.parentNode;

  const todayReadings = html
    .querySelector('a[href="#czytania"]')!
    .text.split("; \r\n")
    .map((t) => t.replaceAll("\n", "").replaceAll("\r", "").trim())
    .filter(Boolean);

  const indexesOfTodayReadings = todayReadings.map((reading) =>
    sectionWithReadings.text.indexOf(reading)
  );

  const entireTextContent = todayReadings.map((reading, index) => {
    const nextIndex = indexesOfTodayReadings[index + 1];
    const title = reading;
    const text = sectionWithReadings.text
      .substring(indexesOfTodayReadings[index], nextIndex)
      .replace(title, "")
      .trim();
    return {
      title,
      text,
    };
  });

  if (entireTextContent.length === 5) {
    return Response.json({
      error: false,
      czytanie1: entireTextContent[0],
      psalm: entireTextContent[1],
      czytanie2: entireTextContent[2],
      alleluja: entireTextContent[3],
      ewangelia: entireTextContent[4],
    });
  } else if (entireTextContent.length === 4) {
    return Response.json({
      error: false,
      czytanie1: entireTextContent[0],
      psalm: entireTextContent[1],
      czytanie2: null,
      alleluja: entireTextContent[2],
      ewangelia: entireTextContent[3],
    });
  } else {
    return Response.json({
      error: true,
    });
  }
}
