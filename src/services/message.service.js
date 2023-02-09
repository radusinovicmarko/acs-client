export const segmentMessage = (content) => {
  const len = Math.floor(Math.random() * 6) + 3;
  return content.match(new RegExp(`.{1,${len}}`, "g"));
};

export const combineParts = (parts) => {
  let content = "";
  const dateTime = parts[0].dateTime;
  const id = parts[0].id;
  const sender = parts[0].sender;
  parts.sort((p1, p2) => p1.segmentSerial - p2.segmentSerial).forEach((part) => {
    content += part.content;
  });
  return { content, dateTime, id, sender };
};

export default {
  segmentMessage,
  combineParts
};
