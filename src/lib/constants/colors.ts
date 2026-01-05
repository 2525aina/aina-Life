export interface ColorDef {
    id: string;
    name: string;
    hex: string;
}

export const PET_COLORS: ColorDef[] = [
    // White / Cream 系
    { id: 'white', name: 'ホワイト', hex: '#FFFFFF' },
    { id: 'off_white', name: 'オフホワイト', hex: '#F8F8FF' },
    { id: 'ivory', name: 'アイボリー', hex: '#FBF5E6' },
    { id: 'cream', name: 'クリーム', hex: '#FFFDD0' },
    { id: 'vanilla', name: 'バニラ', hex: '#F3E5AB' },
    { id: 'pearl', name: 'パール', hex: '#EAE0C8' },
    { id: 'snow', name: 'スノー', hex: '#FFFAFA' },
    { id: 'milk', name: 'ミルク', hex: '#FDFFF5' },
    { id: 'biscuit', name: 'ビスケット', hex: '#FFE4C4' },
    { id: 'champagne', name: 'シャンパン', hex: '#F7E7CE' },

    // Black / Grey 系
    { id: 'black', name: 'ブラック', hex: '#000000' },
    { id: 'jet_black', name: 'ジェットブラック', hex: '#343434' },
    { id: 'charcoal', name: 'チャコール', hex: '#36454F' },
    { id: 'slate', name: 'スレート', hex: '#708090' },
    { id: 'graphite', name: 'グラファイト', hex: '#53565B' },
    { id: 'grey', name: 'グレー', hex: '#808080' },
    { id: 'ash', name: 'アッシュ', hex: '#B2BEB5' },
    { id: 'silver', name: 'シルバー', hex: '#C0C0C0' },
    { id: 'platinum', name: 'プラチナ', hex: '#E5E4E2' },
    { id: 'blue_grey', name: 'ブルーグレー', hex: '#6699CC' },

    // Brown / Chocolate 系
    { id: 'brown', name: 'ブラウン', hex: '#964B00' },
    { id: 'dark_brown', name: 'ダークブラウン', hex: '#654321' },
    { id: 'chocolate', name: 'チョコレート', hex: '#7B3F00' },
    { id: 'cocoa', name: 'ココア', hex: '#D2691E' },
    { id: 'mocha', name: 'モカ', hex: '#967969' },
    { id: 'coffee', name: 'コーヒー', hex: '#6F4E37' },
    { id: 'liver', name: 'レバー', hex: '#674C47' },
    { id: 'mahogany', name: 'マホガニー', hex: '#C04000' },
    { id: 'russet', name: 'ラセット', hex: '#80461B' },
    { id: 'sepia', name: 'セピア', hex: '#704214' },

    // Red / Orange / Apricot 系
    { id: 'red', name: 'レッド', hex: '#FF0000' },
    { id: 'red_fawn', name: 'レッドフォーン', hex: '#C54B4B' },
    { id: 'orange', name: 'オレンジ', hex: '#FFA500' },
    { id: 'apricot', name: 'アプリコット', hex: '#FBCEB1' },
    { id: 'fawn', name: 'フォーン', hex: '#E5AA70' },
    { id: 'tan', name: 'タン', hex: '#D2B48C' },
    { id: 'gold', name: 'ゴールド', hex: '#FFD700' },
    { id: 'wheat', name: 'ウィートン', hex: '#F5DEB3' },
    { id: 'ginger', name: 'ジンジャー', hex: '#B06500' },
    { id: 'rust', name: 'ラスト（錆色）', hex: '#B7410E' },

    // Yellow / Beige 系
    { id: 'yellow', name: 'イエロー', hex: '#FFFF00' },
    { id: 'blonde', name: 'ブロンド', hex: '#FAF0BE' },
    { id: 'lemon', name: 'レモン', hex: '#FFF700' },
    { id: 'beige', name: 'ベージュ', hex: '#F5F5DC' },
    { id: 'buff', name: 'バフ', hex: '#F0DC82' },
    { id: 'sand', name: 'サンド', hex: '#C2B280' },
    { id: 'khaki', name: 'カーキ', hex: '#C3B091' },
    { id: 'camel', name: 'キャメル', hex: '#C19A6B' },

    // Blue / Dilute 系
    { id: 'blue', name: 'ブルー（動物色）', hex: '#A2A2D0' },
    { id: 'isabella', name: 'イザベラ', hex: '#F4AC7C' },
    { id: 'lilac', name: 'ライラック', hex: '#C8A2C8' },
    { id: 'lavender', name: 'ラベンダー', hex: '#E6E6FA' },

    // Patterns / Mixed (単色以外) - Hexは代表色
    { id: 'tricolor', name: 'トライカラー', hex: '#ffffff' }, // 代表色なし white base
    { id: 'bicolor_bw', name: '白黒', hex: '#7F7F7F' },
    { id: 'bicolor_br', name: '茶白', hex: '#CD853F' },
    { id: 'brindle', name: 'ブリンドル（虎毛）', hex: '#8B4513' },
    { id: 'merle', name: 'マール', hex: '#C0C0C0' },
    { id: 'blue_merle', name: 'ブルーマール', hex: '#A9A9A9' },
    { id: 'red_merle', name: 'レッドマール', hex: '#BC8F8F' },
    { id: 'harlequin', name: 'ハーレクイン', hex: '#FFFFFF' },
    { id: 'dapple', name: 'ダップル', hex: '#A9A9A9' },
    { id: 'piebald', name: 'パイボールド', hex: '#FFFFFF' },
    { id: 'parti', name: 'パーティカラー', hex: '#FFFFFF' },
    { id: 'roan', name: 'ローン', hex: '#778899' },
    { id: 'ticked', name: 'ティック', hex: '#FFFFFF' },
    { id: 'sable', name: 'セーブル', hex: '#8B4513' },
    { id: 'wolf_sable', name: 'ウルフセーブル', hex: '#808080' },
    { id: 'agouti', name: 'アグーチ', hex: '#8B4513' },

    // Cats Specific Patterns
    { id: 'tabby', name: 'タビー（縞模様）', hex: '#D2B48C' },
    { id: 'brown_tabby', name: 'ブラウンタビー', hex: '#8B4513' },
    { id: 'silver_tabby', name: 'シルバータビー', hex: '#C0C0C0' },
    { id: 'red_tabby', name: 'レッドタビー', hex: '#D2691E' },
    { id: 'blue_tabby', name: 'ブルータビー', hex: '#778899' },
    { id: 'mackerel_tabby', name: 'サバトラ', hex: '#C0C0C0' },
    { id: 'classic_tabby', name: 'クラシックタビー', hex: '#000000' },
    { id: 'spotted_tabby', name: 'スポッテッドタビー', hex: '#D2B48C' },
    { id: 'patched_tabby', name: 'パッチドタビー', hex: '#D2B48C' },
    { id: 'tortoiseshell', name: 'サビ（トーティ）', hex: '#000000' },
    { id: 'calico', name: '三毛', hex: '#FFFFFF' },
    { id: 'dilute_calico', name: 'ダイリュートキャリコ', hex: '#FFFFF0' },
    { id: 'point', name: 'ポイントカラー', hex: '#F5F5DC' },
    { id: 'seal_point', name: 'シールポイント', hex: '#3E2723' },
    { id: 'blue_point', name: 'ブルーポイント', hex: '#78909C' },
    { id: 'chocolate_point', name: 'チョコポイント', hex: '#5D4037' },
    { id: 'lilac_point', name: 'ライラックポイント', hex: '#BDBDBD' },
    { id: 'flame_point', name: 'フレームポイント', hex: '#FFCC80' },
    { id: 'lynx_point', name: 'リンクスポイント', hex: '#BCAAA4' },
    { id: 'smoke', name: 'スモーク', hex: '#757575' },
    { id: 'chinchilla', name: 'チンチラ', hex: '#E0E0E0' },
    { id: 'shaded', name: 'シェーデッド', hex: '#BDBDBD' },

    // Exotic / Reptile / Fish colors
    { id: 'green', name: 'グリーン', hex: '#008000' },
    { id: 'lime', name: 'ライム', hex: '#00FF00' },
    { id: 'olive', name: 'オリーブ', hex: '#808000' },
    { id: 'emerald', name: 'エメラルド', hex: '#50C878' },
    { id: 'teal', name: 'ティール', hex: '#008080' },
    { id: 'aqua', name: 'アクア', hex: '#00FFFF' },
    { id: 'turquoise', name: 'ターコイズ', hex: '#40E0D0' },
    { id: 'navy', name: 'ネイビー', hex: '#000080' },
    { id: 'indigo', name: 'インディゴ', hex: '#4B0082' },
    { id: 'purple', name: 'パープル', hex: '#800080' },
    { id: 'violet', name: 'バイオレット', hex: '#EE82EE' },
    { id: 'magenta', name: 'マゼンタ', hex: '#FF00FF' },
    { id: 'pink', name: 'ピンク', hex: '#FFC0CB' },
    { id: 'rose', name: 'ローズ', hex: '#FF007F' },
    { id: 'coral', name: 'コーラル', hex: '#FF7F50' },
    { id: 'salmon', name: 'サーモン', hex: '#FA8072' },
    { id: 'peach', name: 'ピーチ', hex: '#FFE5B4' },
    { id: 'copper', name: 'カッパー', hex: '#B87333' },
    { id: 'holographic', name: 'ホログラフィック', hex: '#E6E6FA' }, // イメージ色
    { id: 'albino', name: 'アルビノ', hex: '#FFFFFF' },
    { id: 'leucistic', name: 'リューシスティック', hex: '#FEFEFA' },
];
