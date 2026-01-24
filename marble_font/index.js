const LETTERS = [
    'ː', 'a', 'b', 'd', 'ð',
    'dʒ', 'e', 'ə', 'f', 'g',
    'ɣ', 'h', 'i', 'j', 'k',
    'l', 'm', 'n', 'ɲ', 'ŋ',
    'o', 'p', 'r', 's', 'ʃ',
    't', 'tʃ', 'u', 'v', 'w',
    'x', 'z', 'ʒ', 'ʔ', 'θ',
];
let config = {};
let selected_letter = 'a';
let is_editing = false;
let letter_spacing = 4;


function addLetter(text_area_id, letter) {
    let text_area = document.getElementById(text_area_id);
    let img = document.createElement("img");
    img.className = "letter-output";
    img.src = "letters/" + letter + ".svg";
    img.style.left = (text_area.cursor_position_x ?? 5).toString() + "px";
    img.style.top = (text_area.cursor_position_y ?? 5).toString() + "px";
    
    let letter_config = config[letter];
    let cursor_position_x = (text_area.cursor_position_x ?? 5);
    cursor_position_x += (letter_config.width ?? 256) / 16.0;
    cursor_position_x += letter_spacing;
    text_area.cursor_position_x = cursor_position_x;

    text_area.insertAdjacentElement("beforeend", img);
    text_area.written_text = (text_area.written_text ?? "") + letter;
}


function deleteLetter(text_area_id) {
    let text_area = document.getElementById(text_area_id);
    let letter = text_area.written_text.at(-1);
    text_area.cursor_position_x = Math.max(text_area.cursor_position_x - config[letter].width ?? 256, 5);
    text_area.removeChild(text_area.lastChild);
}


function clearLetters(text_area_id) {
    let text_area = document.getElementById(text_area_id);
    text_area.textContent = "";
    text_area.cursor_position_x = 5;
    text_area.cursor_position_y = 5;
}


function loadConfig() {
    let upload_label = document.getElementById("upload-config");
    let input = upload_label.getElementsByClassName("file-input")[0];
    if (input == null) {
        return;
    }
    let json_file = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        config = JSON.parse(e.target.result);
        updateConfigLetterDisplay();
    };
    reader.readAsText(json_file);
}


function downloadConfig() {
    let json_text = JSON.stringify(config, null, 4);
    let data_str = "data:text/json;charset=utf-8," + encodeURIComponent(json_text);
    let download_element = document.createElement("a");
    download_element.href = data_str;
    download_element.download = "font_settings.json";
    document.body.appendChild(download_element);
    download_element.click();
    download_element.remove();
}


function updateConfigLetterDisplay() {
    if (!(selected_letter in config)) {
        return;
    }

    let letter_config = config[selected_letter];

    let width_input = document.getElementById("config-letter-width");
    width_input.value = letter_config.width ?? 256;
    
    let offset_input = document.getElementById("config-letter-offset");
    offset_input.value = letter_config.offset ?? 0;

    clearLetters("spacing-text-area");
    for (let i=0; i<12; i++) {
        addLetter("spacing-text-area", selected_letter);
    }

    let letter_preview_image = document.getElementById("config-letter-preview-image");
    letter_preview_image.src = "letters/" + selected_letter + ".svg";

    let letter_rect = document.getElementById("config-letter-rect");
    let letter_width = (letter_config.width ?? 256);
    let letter_offset = (letter_config.offset ?? 0);

    letter_rect.setAttribute("x" , (512 * 0.5 + letter_offset - letter_width * 0.5) * 0.5);
    letter_rect.setAttribute("width", letter_width * 0.5);
}


function set_selected_letter(new_letter) {
    selected_letter = new_letter;
    updateConfigLetterDisplay();
}


async function initConfig() {
    const response = await fetch("font_settings.json");
    let json = await response.json();
    config = json;
    updateConfigLetterDisplay();
}


function createKeyboard(target_text_area_id) {
    let keyboard = document.createElement("div");
    keyboard.className = "keyboard";

    for (let letter of LETTERS) {
        let button = document.createElement("button");
        button.onclick = addLetter.bind(this, target_text_area_id, letter);
        button.className = "letter-input";

        let icon = document.createElement("img");
        icon.src = "letters/" + letter + ".svg";
        icon.className = "letter-input";
        button.insertAdjacentElement("beforeend", icon);

        let hr = document.createElement("hr");
        button.insertAdjacentElement("beforeend", hr);

        let p = document.createElement("p");
        p.innerText = letter;
        p.className = "letter-input";
        button.insertAdjacentElement("beforeend", p);

        keyboard.insertAdjacentElement("beforeend", button);
    };

    {
        let button = document.createElement("button");
        button.onclick = deleteLetter.bind(this, target_text_area_id);
        button.className = "letter-input";

        let p = document.createElement("p");
        p.innerText = "←";
        p.className = "letter-input";
        button.insertAdjacentElement("beforeend", p);

        keyboard.insertAdjacentElement("beforeend", button);
    }

    let target_text_area = document.getElementById(target_text_area_id);
    target_text_area.insertAdjacentElement("afterend", keyboard);
}


function createKeyboardIconOnly(keyboard_id, callback = null) {
    let keyboard = document.getElementById(keyboard_id);

    for (let letter of LETTERS) {
        let button = document.createElement("button");
        if (callback !== null) {
            button.onclick = callback.bind(this, letter);
        }
        button.className = "letter-input";

        let icon = document.createElement("img");
        icon.src = "letters/" + letter + ".svg";
        icon.className = "letter-input";
        button.insertAdjacentElement("beforeend", icon);

        keyboard.insertAdjacentElement("beforeend", button);
    };
}


function update_letter_config_to_input() {
    if (!(selected_letter in config)) {
        return;
    }
    
    let width_input = document.getElementById("config-letter-width");
    config[selected_letter].width = parseInt(width_input.value);
    
    let offset_input = document.getElementById("config-letter-offset");
    config[selected_letter].offset = parseInt(offset_input.value);

    updateConfigLetterDisplay();
}


function main() {
    initConfig();

    createKeyboard("main-text-area");
    createKeyboardIconOnly("spacing-keyboard", set_selected_letter);
}

main();