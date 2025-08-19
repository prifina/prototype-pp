import { marked } from "marked";

function customDeserialize(str) {
  // console.log("DESERIALIZE ", str);
  const obj = {};
  str.split(";").forEach((pair) => {
    const [key, value] = pair.split("=");
    try {
      // Decode each part safely
      obj[decodeURIComponent(key)] = decodeURIComponent(value);
    } catch (e) {
      console.error("Failed to decode URI component", e);
      // Handle or log the error, or assign a default value
      obj[key] = value; // Optionally keep the original undecoded value
    }
  });
  return obj;
}

export const loadingMessageId = "test-message";

export function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16).substring(2);

  return `id-${timestamp}-${hexadecimalString}`;
}

export const getStreamAnswer = async (data, chatId, update = false) => {
  // Set options for marked
  marked.use({
    async: false,
    breaks: true,
    extensions: null,
    gfm: true,
    hooks: null,
    pedantic: false,
    silent: false,
    tokenizer: null,
    walkTokens: null,
  });

  //console.log("STREAM ", data);
  const reader = data.getReader();
  const decoder = new TextDecoder();
  let done = false;
  //   if (!update) {
  //     document.getElementById(chatId).querySelector(".dots").style.display =
  //       "none";
  //   }
  const element = document
    .getElementById(loadingMessageId)
    .querySelector(".question-answer");
  console.log("ELEMENT FOUND ", element, new Date().toISOString());
  if (update) {
    element.innerHTML += " ";
  }

  let answer = "";
  let finish_reason = null;
  //let count = 0;
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    // count++;
    console.log("STREAM VALUE ", decoder.decode(value));
    /*
     STREAM VALUE  text=-;finish_reason=null
  text=%20Outdoor;finish_reason=null
  text=%20activities;finish_reason=null
      */

    let chunkValue = decoder.decode(value);
    if (value !== "") {
      const chunks = chunkValue.split("\n");
      if (chunks.length > 0) {
        console.log("CHUNKS ", chunks);

        const deserialized = chunks
          .filter((c) => c !== "")
          .map((chunk) => JSON.stringify(customDeserialize(chunk)))
          .map((str) => JSON.parse(str));
        console.log(deserialized, deserialized.length);
        if (deserialized.length > 0) {
          chunkValue = "";
          deserialized.forEach((c) => {
            finish_reason = c.finish_reason;
            if (c.text !== undefined) {
              chunkValue += c.text;
            }
          });
        }
      }
      // finish_reason = chunk.finish_reason;
      // streamValue = chunk.text;
    }

    //const chunkValue = decoder.decode(streamValue);
    //const text = chunkValue.replaceAll("\n", "<br/>");
    const text = answer + chunkValue;
    //element.innerHTML += text;
    //element.innerHTML += marked(chunkValue);
    //console.log("TEXT ", text);
    element.innerHTML = await marked.parse(text);
    //element.innerHTML += chunkValue;

    // const scrollHere = document.getElementById("scroll-marker");
    // scrollHere.scrollIntoView(true, {
    //   behavior: "smooth",
    //   block: "end",
    //   inline: "nearest",
    // });
    answer += chunkValue;
  }

  // console.log("COUNT ", count);
  //const stripped = await remark().use(strip, { keep: ['html'] }).process(answer);
  //const stripped = await remark().use(strip).process(answer);
  /*  const stripped = await remark()
       .use(retainLineBreaks) // Use the custom plugin first to handle line breaks
       .use(strip)            // Then use strip-markdown
       .process(answer); */

  // console.log("STRIPPED ", stripped.toString());

  console.log(
    "STREAM RESPONSE ",
    answer,
    finish_reason,
    new Date().toISOString()
  );
  //return Promise.resolve({ answer: stripped.toString().replace(/###/g, ''), finish_reason });
  //await new Promise((resolve) => setTimeout(resolve, 3000));
  //answer = answer.replaceAll("<br/>", "\n");
  //console.log("STREAM RESPONSE2 ", answer, finish_reason, new Date().toISOString());

  return Promise.resolve({ answer, finish_reason });
};
