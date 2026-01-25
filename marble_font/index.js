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
let config_selected_letter = 'a';
let kerning_selected_letter_first = 'ː';
let kerning_selected_letter_second = 'ː';
let is_editing = false;
let letter_spacing = 4;


function addLetter(text_area_id, letter) {
    let letter_config = config[letter];

    let text_area = document.getElementById(text_area_id);
    let img = document.createElement("img");
    img.className = "letter-output";
    img.src = "letters/" + letter + ".svg";

    let cursor_position_x = (text_area.cursor_position_x ?? 10);
    let cursor_position_y = (text_area.cursor_position_y ?? 5);
    let letter_width = letter_config.width ?? 256;
    let letter_offset = letter_config.offset ?? 0;

    let letter_kerning = 0;
    if (text_area.written_text !== undefined && text_area.written_text.length > 0) {
        var prev_letter = text_area.written_text.at(-1);
        letter_kerning = letter_config.kerning[prev_letter] ?? 0;
    }

    let x = cursor_position_x - (512 * 0.5 + letter_offset - letter_width * 0.5) / 16.0 - letter_kerning / 16.0
    img.style.left = x.toString() + "px";
    img.style.top = cursor_position_y.toString() + "px";
    
    cursor_position_x += letter_width / 16.0 - letter_kerning / 16.0;
    cursor_position_x += letter_spacing;
    text_area.cursor_position_x = cursor_position_x;

    text_area.insertAdjacentElement("beforeend", img);
    text_area.written_text = (text_area.written_text ?? "") + letter;
}


function deleteLetter(text_area_id) {
    let text_area = document.getElementById(text_area_id);
    
    if (text_area.written_text === undefined || text_area.written_text.length === 0) {
        return;
    }
    
    let cursor_position_x = (text_area.cursor_position_x ?? 10);
    let letter = text_area.written_text.at(-1);
    let letter_config = config[letter];
    let letter_width = letter_config.width ?? 256;

    let letter_kerning = 0;
    if (text_area.written_text !== undefined && text_area.written_text.length > 1) {
        var prev_letter = text_area.written_text.at(-2);
        letter_kerning = letter_config.kerning[prev_letter] ?? 0;
    }

    text_area.cursor_position_x = Math.max(cursor_position_x - letter_width / 16.0 - letter_spacing + letter_kerning / 16.0, 10);
    text_area.removeChild(text_area.lastChild);
    text_area.written_text = text_area.written_text.slice(0, text_area.written_text.length - 1);
}


function clearLetters(text_area_id) {
    let text_area = document.getElementById(text_area_id);
    text_area.textContent = "";
    text_area.cursor_position_x = 10;
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
    if (!(config_selected_letter in config)) {
        return;
    }

    let letter_config = config[config_selected_letter];

    let width_input = document.getElementById("config-letter-width");
    width_input.value = letter_config.width ?? 256;
    
    let offset_input = document.getElementById("config-letter-offset");
    offset_input.value = letter_config.offset ?? 0;

    clearLetters("spacing-text-area");
    for (let i=0; i<12; i++) {
        addLetter("spacing-text-area", config_selected_letter);
    }

    let letter_preview_image = document.getElementById("config-letter-preview-image");
    letter_preview_image.src = "letters/" + config_selected_letter + ".svg";

    let letter_rect = document.getElementById("config-letter-rect");
    let letter_width = (letter_config.width ?? 256);
    let letter_offset = (letter_config.offset ?? 0);

    letter_rect.setAttribute("x" , (512 * 0.5 + letter_offset - letter_width * 0.5) * 0.5);
    letter_rect.setAttribute("width", letter_width * 0.5);
    
    toggleKeyboardKey("spacing-keyboard", config_selected_letter);
}


function setConfigSelectedLetter(new_letter) {
    config_selected_letter = new_letter;
    updateConfigLetterDisplay();
}


async function initConfig() {
    const response = await fetch("font_settings.json");
    let json = await response.json();
    config = json;
    updateConfigLetterDisplay();
    updateKerningDisplay();
}


function createKeyboard(target_text_area_id) {
    let keyboard = document.createElement("div");
    keyboard.className = "keyboard";

    for (let letter of LETTERS) {
        let button = document.createElement("button");
        button.onclick = addLetter.bind(this, target_text_area_id, letter);
        button.className = "letter-input";
        button.letter_id = letter;
        
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
        button.letter_id = letter;

        let icon = document.createElement("img");
        icon.src = "letters/" + letter + ".svg";
        icon.className = "letter-input";
        button.insertAdjacentElement("beforeend", icon);

        keyboard.insertAdjacentElement("beforeend", button);
    };
}


function updateLetterConfigToInput() {
    if (!(config_selected_letter in config)) {
        return;
    }
    
    let width_input = document.getElementById("config-letter-width");
    config[config_selected_letter].width = parseInt(width_input.value);
    
    let offset_input = document.getElementById("config-letter-offset");
    config[config_selected_letter].offset = parseInt(offset_input.value);

    updateConfigLetterDisplay();
}


function updateKerningDisplay() {
    setKerningLetter("kerning-image-view-first", kerning_selected_letter_first, 40);
    setKerningLetter("kerning-image-debug-first", kerning_selected_letter_first, 40);
    setRectLetter("kerning-rect-first", kerning_selected_letter_first, 40);
    let letter_first_config = config[kerning_selected_letter_first];
    let letter_width = letter_first_config.width ?? 256;
    let letter_second_config = config[kerning_selected_letter_second];
    let letter_kerning = letter_second_config.kerning[kerning_selected_letter_first] ?? 0;
    let letter_second_x = 40 + 32 - letter_kerning * 0.5 + letter_width * 0.5
    setKerningLetter("kerning-image-view-second", kerning_selected_letter_second, letter_second_x);
    setKerningLetter("kerning-image-debug-second", kerning_selected_letter_second, letter_second_x);
    setRectLetter("kerning-rect-second", kerning_selected_letter_second, letter_second_x);

    toggleKeyboardKey("kerning-keyboard-first", kerning_selected_letter_first);
    toggleKeyboardKey("kerning-keyboard-second", kerning_selected_letter_second);

    let width_input = document.getElementById("kerning-letter-width");
    width_input.value = config[kerning_selected_letter_second].kerning[kerning_selected_letter_first] ?? 0;
}


function toggleKeyboardKey(keyboard_id, letter) {
    let keyboard = document.getElementById(keyboard_id);
    let keys = keyboard.getElementsByTagName("*");
    for (let key of keys) {
        if ((key.letter_id ?? "") == letter) {
            key.classList.add("pressed");
        } else {
            key.classList.remove("pressed");
        }
    }
}


function setRectLetter(rect_id, letter, x) {
    let letter_rect = document.getElementById(rect_id);
    let letter_config = config[letter];
    let letter_width = letter_config.width ?? 256;
    let letter_offset = letter_config.offset ?? 0;
    let new_x = x - (512 * 0.5 + letter_offset - letter_width * 0.5) * 0.5 
    new_x += (512 * 0.5 + letter_offset - letter_width * 0.5) * 0.5 
    new_x -= 6; // Don't ask me how I got this magic number
    letter_rect.setAttribute("x" , new_x);
    letter_rect.setAttribute("width", letter_width * 0.5);
}


function setKerningLetter(image_id, letter, x) {
    let img = document.getElementById(image_id);
    let letter_config = config[letter];
    let letter_width = letter_config.width ?? 256;
    let letter_offset = letter_config.offset ?? 0;
    let new_x = x - (512 * 0.5 + letter_offset - letter_width * 0.5) * 0.5
    img.style.left = new_x.toString() + "px";
    img.src = "letters/" + letter + ".svg";
}


function setSelectedKerningLetterFirst(new_letter) {
    kerning_selected_letter_first = new_letter;
    updateKerningDisplay();
}


function setSelectedKerningLetterSecond(new_letter) {
    kerning_selected_letter_second = new_letter;
    updateKerningDisplay();
}


function updateSelectedKerningOffset() {
    let width_input = document.getElementById("kerning-letter-width");
    if (config[kerning_selected_letter_second].kerning == undefined) {
        config[kerning_selected_letter_second].kerning = {};
    }
    config[kerning_selected_letter_second].kerning[kerning_selected_letter_first] = parseInt(width_input.value);
    updateKerningDisplay();
}


function kerningSelectNext() {
    let next_idx = LETTERS.indexOf(kerning_selected_letter_second) + 1;
    if (next_idx == LETTERS.length) {
        let next_idx_2 = LETTERS.indexOf(kerning_selected_letter_first) + 1;
        if (next_idx_2 != LETTERS.length) {
            kerning_selected_letter_first = LETTERS[next_idx_2];
            kerning_selected_letter_second = LETTERS[0];
        }
    } else {
        kerning_selected_letter_second = LETTERS[next_idx];
    }
    updateKerningDisplay();
}


function kerningSelectPrev() {
    let next_idx = LETTERS.indexOf(kerning_selected_letter_second) - 1;
    if (next_idx == -1) {
        let next_idx_2 = LETTERS.indexOf(kerning_selected_letter_first) - 1;
        if (next_idx_2 != -1) {
            kerning_selected_letter_first = LETTERS[next_idx_2];
            kerning_selected_letter_second = LETTERS.at(-1);
        }
    } else {
        kerning_selected_letter_second = LETTERS[next_idx];
    }
    updateKerningDisplay();
}


function main() {
    initConfig();

    createKeyboard("main-text-area");
    createKeyboardIconOnly("spacing-keyboard", setConfigSelectedLetter);
    createKeyboardIconOnly("kerning-keyboard-first", setSelectedKerningLetterFirst);
    createKeyboardIconOnly("kerning-keyboard-second", setSelectedKerningLetterSecond);
}

main();