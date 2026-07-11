/**
 * Ymeyme-Rhyme(イムイムライム)の詩データ。
 * 出典: 冊子教材 Ymeyme-Rhyme orange(2022年度)/ blue(2023年度)。
 * 詩の本文は冊子に掲載された抜粋の行構成をそのまま採録している。
 *
 * 収録作品は全てパブリックドメイン。ただし "This Is Just To Say"(1934年発表)のみ
 * 日本ではPDだが米国では2020年代末まで著作権が残る可能性がある。
 */

export type Booklet = "orange" | "blue";

export type RhymeCommentary = {
  /** 詩(抜粋部分)の文学的な解説 */
  poem: string;
  /** 作者の解説 */
  author: string;
  /** その時代の解説 */
  era: string;
  /** どう語り継がれてきたか */
  legacy: string;
};

export type RhymePoem = {
  id: string;
  booklet: Booklet;
  month: string;
  monthJa: string;
  title: string;
  /** 冊子の表記に合わせた作者名(伝承歌は省略) */
  author?: string;
  authorJa?: string;
  lines: string[];
  commentary: RhymeCommentary;
};

export const BOOKLET_LABELS: Record<Booklet, string> = {
  orange: "オレンジ",
  blue: "ブルー",
};

export const POEMS: RhymePoem[] = [
  // ---------------- orange(2022年度) ----------------
  {
    id: "orange-april",
    booklet: "orange",
    month: "April",
    monthJa: "4月",
    title: "Eeny, Meeny, Miny, Moe",
    authorJa: "伝承童謡(マザーグース)",
    lines: [
      "Eeny, meeny, miny, moe,",
      "Catch a tiger by the toe",
      "If he squeals, let him go.",
      "Eeny, meeny, miny, moe.",
    ],
    commentary: {
      poem: "鬼ごっこの鬼を決めるときに指をさしながら唱える「数え唄」。イーニー・ミーニー・マイニー・モーということば自体に意味はなく、moe / toe / go と韻を踏むリズムの楽しさが主役です。最後の一語が当たった人が選ばれます。",
      author: "作者はわかっていません。子どもから子どもへ口伝えで広がった伝承童謡で、マザーグースのひとつに数えられます。",
      era: "19世紀にはイギリスやアメリカの子どもたちの間で広く記録されていました。つかまえるものはトラのほかにもカエルやクモなど、土地や時代によってさまざまに変わります。",
      legacy: "世界中に同じ役割の唄があり、日本の「どちらにしようかな」はその仲間です。今も英語圏の校庭で現役で、映画や小説では「運命を選ぶ」場面の小道具としても登場します。",
    },
  },
  {
    id: "orange-may",
    booklet: "orange",
    month: "May",
    monthJa: "5月",
    title: "Piping Down The Valleys Wild",
    author: "William Blake",
    authorJa: "ウィリアム・ブレイク",
    lines: [
      "Piping down the valleys wild",
      "Piping songs of pleasant glee",
      "On a cloud I saw a child",
      "And he laughing said to me:",
    ],
    commentary: {
      poem: "詩集『無垢の歌』の巻頭に置かれた序詩。笛を吹きながら谷を下る詩人が、雲の上の子どもに出会う場面です。wild / child、glee / me と交互に韻を踏み、「この詩集は子どものために歌われる歌だよ」と宣言する役割を持っています。",
      author: "ウィリアム・ブレイク(1757-1827)。ロンドンの詩人であり画家・銅版画家。詩に自分で絵と彩色をほどこした手作りの本を作りました。生前はほとんど評価されず、死後にロマン派の先駆者として再発見されました。",
      era: "『無垢の歌』が出版された1789年はフランス革命の年。産業革命がすすむロンドンで、子どもの純真さをまっすぐ見つめる詩が生まれました。",
      legacy: "ブレイク自身が刷って彩色した『無垢の歌』の原本は、いまや世界の美術館の宝物です。「笛吹きと子ども」のイメージは、後の童謡詩や児童文学に大きな影響を与えました。",
    },
  },
  {
    id: "orange-june",
    booklet: "orange",
    month: "June",
    monthJa: "6月",
    title: "Acca Bacca Soda Cracker",
    authorJa: "伝承童謡",
    lines: [
      "Acca bacca soda cracker",
      "Acca bacca boo.",
      "Acca bacca soda cracker",
      "out goes you!",
    ],
    commentary: {
      poem: "「アッカ・バッカ」という呪文のような音の反復がおもしろい数え唄。意味よりも音とリズムで遊ぶ唄で、boo! でおどかして、out goes you!(きみが抜けた!)で鬼や順番が決まります。",
      author: "作者はわかっていません。アメリカの校庭で歌い継がれてきた鬼決め唄です。",
      era: "19〜20世紀にアメリカ各地の子どもの遊び唄として採集され、たくさんのバリエーションが記録されています。",
      legacy: "ソーダクラッカーという身近なおやつが出てくるところがアメリカらしい唄です。今もかくれんぼや鬼ごっこの前の「順番決め」で使われています。",
    },
  },
  {
    id: "orange-july",
    booklet: "orange",
    month: "July",
    monthJa: "7月",
    title: "This Is Just To Say",
    author: "William Carlos Williams",
    authorJa: "ウィリアム・カーロス・ウィリアムズ",
    lines: [
      "I have eaten the plums",
      "that were in the icebox",
      "and which you were probably",
      "saving for breakfast",
      "Forgive me they were delicious",
      "so sweet and so cold",
    ],
    commentary: {
      poem: "冷蔵庫のプラム(すもも)を食べてしまったことを家族に詫びる「置き手紙」が、そのまま詩になった作品。飾ったことばをいっさい使わず、改行の呼吸だけで詩にしてしまう実験です。最後の so sweet and so cold(あんなに甘くて、あんなに冷たかった)の感覚が鮮烈に残ります。",
      author: "ウィリアム・カーロス・ウィリアムズ(1883-1963)。アメリカ・ニュージャージー州の小児科のお医者さんで、診療の合間に処方箋の裏にまで詩を書きました。日常のアメリカ英語で詩を書くことを追求しました。",
      era: "1934年発表。20世紀前半のアメリカでは、むずかしい言葉ではなく身のまわりのことばで詩を書く「モダニズム」という新しい動きが起きていました。",
      legacy: "英語圏でいちばん有名な「メモの詩」となり、この形をまねたパロディが今も無数に作られています。「ごめん、でもおいしかった」という正直すぎる謝り方は、SNS時代の大喜利の元祖ともいわれます。",
    },
  },
  {
    id: "orange-september",
    booklet: "orange",
    month: "September",
    monthJa: "9月",
    title: "Water, Is Taught By Thirst",
    author: "Emily Dickinson",
    authorJa: "エミリー・ディキンソン",
    lines: [
      "Water, is taught by thirst.",
      "Land? by the oceans passed.",
      "Transport? by throe.",
      "Peace? by its battles told.",
      "Love, by Memorial mold.",
      "Birds, by the snow.",
    ],
    commentary: {
      poem: "「水のありがたさは、のどの渇きが教えてくれる」。大切なものの価値は、それが無いときにこそわかる — という逆説を、たった6行にならべた詩です。渇き→水、海→陸、雪→鳥、と一行ごとに「欠けているもの」と「本当に大事なもの」が対になっています。",
      author: "エミリー・ディキンソン(1830-1886)。アメリカ・マサチューセッツ州アマーストの家からほとんど出ずに、約1800篇もの詩を書きました。生前に発表されたのはわずか10篇ほどです。",
      era: "19世紀半ばのニューイングランド。南北戦争の激動の時代に、彼女は自分の部屋で静かにことばの実験を続けていました。",
      legacy: "死後、妹が机の引き出しから詩の束を発見して出版され、世界を驚かせました。今ではアメリカ文学を代表する詩人として、教科書に必ず登場します。",
    },
  },
  {
    id: "orange-october",
    booklet: "orange",
    month: "October",
    monthJa: "10月",
    title: "A Midsummer Night's Dream",
    author: "William Shakespeare",
    authorJa: "ウィリアム・シェイクスピア",
    lines: [
      "Night and silence - Who is here?",
      "Weeds of Athens he doth wear:",
      "This is he my master said",
      "Despised the Athenian maid;",
      "Churl, upon thy eyes I throw",
      "All the power this charm doth owe.",
    ],
    commentary: {
      poem: "喜劇『夏の夜の夢』で、いたずら妖精パックが森で眠る若者のまぶたに「恋の魔法の花の汁」をたらす場面の台詞。ところがこれは人違いで、ここから恋の大混乱が始まります。here / wear、throw / owe の韻が、まじないの呪文らしい響きを作っています。",
      author: "ウィリアム・シェイクスピア(1564-1616)。イギリスの劇作家・詩人。喜劇・悲劇・史劇あわせて約37本の戯曲を残した、英語文学最大の作家です。",
      era: "1590年代のエリザベス朝ロンドン。グローブ座などの芝居小屋に庶民から貴族までが詰めかけた、演劇の黄金時代に書かれました。",
      legacy: "『夏の夜の夢』は夏の野外劇や学校劇の世界的な定番です。結婚式でおなじみのメンデルスゾーン「結婚行進曲」も、もとはこの劇のために書かれた音楽です。",
    },
  },
  {
    id: "orange-november",
    booklet: "orange",
    month: "November",
    monthJa: "11月",
    title: "Georgie Porgie",
    author: "Mother Goose",
    authorJa: "マザーグース",
    lines: [
      "Georgie Porgie, pudding and pie,",
      "Kissed the girls and made them cry;",
      "When the boys came out to play,",
      "Georgie Porgie ran away.",
    ],
    commentary: {
      poem: "女の子を泣かせるいたずらっ子ジョージーが、男の子たちが出てくると逃げてしまう — 弱い者いじめをからかう唄です。pie / cry、play / away の韻に加えて、Georgie Porgie(ジョージー・ポージー)という名前の音遊びそのものが主役です。",
      author: "作者不詳のマザーグース(イギリスを中心に伝わる伝承童謡の総称)です。",
      era: "18〜19世紀の童謡集に記録されています。モデルは17世紀の廷臣ジョージ・ヴィリアーズだ、いや摂政時代のジョージ4世だ、といった説が昔から語られてきました(確かな証拠はありません)。",
      legacy: "英語圏では「からかい唄」の代表格として誰もが知っています。名前に韻を重ねてはやしたてるスタイルは、今の子どもたちの遊びにも受け継がれています。",
    },
  },
  {
    id: "orange-december",
    booklet: "orange",
    month: "December",
    monthJa: "12月",
    title: "Trees",
    author: "Sara Coleridge",
    authorJa: "セアラ・コールリッジ",
    lines: [
      "The oak is called the king of trees.",
      "The aspen quivers in the breeze,",
      "The poplar grows up straight and tall,",
      "The peach tree spreads along the wall,",
      "The sycamore gives pleasant shade,",
      "The willow droops in watery glade,",
      "The fir tree useful timber gives.",
      "The beech amid the forest lives.",
    ],
    commentary: {
      poem: "オークは木の王さま、ポプラはまっすぐ高く、ヤナギは水辺にしだれて — 木の名前と性格を1行ずつ歌う「おぼえ唄」です。trees / breeze、tall / wall と2行ずつきれいに韻を踏むので、聞いているだけで木の種類が頭に入ります。",
      author: "セアラ・コールリッジ(1802-1852)。ロマン派の大詩人サミュエル・テイラー・コールリッジの娘で、自身も作家・翻訳家として活躍しました。",
      era: "19世紀前半のイギリスでは、子どもが韻を頼りに知識を覚える教育詩がさかんでした。この詩も子ども向けの教本『Pretty Lessons in Verse』(1834)のために書かれました。",
      legacy: "月の名前を歌った「The Months」と並ぶ彼女の代表作として、今もイギリスの教科書やアンソロジーに収められています。",
    },
  },
  {
    id: "orange-january",
    booklet: "orange",
    month: "January",
    monthJa: "1月",
    title: "The Merchant of Venice",
    author: "William Shakespeare",
    authorJa: "ウィリアム・シェイクスピア",
    lines: [
      "If you tickle us, do we not laugh?",
      "If you poison us, do we not die?",
      "And if you wrong us, shall we not revenge?",
      "If we are like you in the rest,",
      "We will resemble you in that!",
    ],
    commentary: {
      poem: "『ヴェニスの商人』で金貸しシャイロックが語る有名な独白の一部。「くすぐられれば笑うし、毒を盛られれば死ぬ。同じ人間ではないか。それなら不当な仕打ちには仕返しをするまでだ」。If you...? の問いかけの繰り返しが、聞く人の胸に迫ります。",
      author: "ウィリアム・シェイクスピア(1564-1616)。10月の『夏の夜の夢』、3月のソネット18と同じ作者です。",
      era: "1596年頃の作品。当時のヨーロッパで差別されていたユダヤ人の金貸しを、単なる悪役ではなく血の通った人間として描いた点が、400年たった今も議論され続けています。",
      legacy: "「人肉1ポンドの裁判」の物語は世界中で上演され、日本でも明治時代から翻案劇が作られました。この独白は、差別について考える教材として今も引用されます。",
    },
  },
  {
    id: "orange-february",
    booklet: "orange",
    month: "February",
    monthJa: "2月",
    title: "Liar, Liar",
    authorJa: "伝承童謡",
    lines: [
      "Liar, liar, pants on fire,",
      "Hanging on a telephone wire!",
      "Liar, liar, pants on fire,",
      "Nose as long as a telephone wire!",
    ],
    commentary: {
      poem: "「うそつき、うそつき、ズボンに火がついた!」— うそをついた子をはやしたてる遊び唄。liar / fire / wire とたたみかける韻と、鼻が電話線ほど伸びるというピノキオのような誇張のおかしさがポイントです。",
      author: "作者はわかっていません。アメリカの校庭で生まれた、比較的新しい伝承唄です。",
      era: "20世紀のアメリカで広まりました。電話線(telephone wire)が出てくるところに、時代が刻まれています。",
      legacy: "Liar, liar, pants on fire! は英語の決まり文句になり、ジム・キャリー主演の映画『ライアーライアー』のタイトルにもなりました。",
    },
  },
  {
    id: "orange-march",
    booklet: "orange",
    month: "March",
    monthJa: "3月",
    title: "Sonnet 18",
    author: "William Shakespeare",
    authorJa: "ウィリアム・シェイクスピア",
    lines: [
      "Shall I compare",
      "thee to a summer's day?",
      "Thou art more lovely",
      "and more temperate:",
      "Rough winds do shake",
      "the darling buds of May,",
      "And summer's lease",
      "hath all too short a date:",
    ],
    commentary: {
      poem: "「君を夏の日にたとえようか。いや、君のほうがずっと美しく、おだやかだ」。154篇あるシェイクスピアのソネット(14行詩)の中でいちばん有名な冒頭部分です。夏でさえ風に荒れ、あっという間に終わってしまう。それに比べて詩の中の「君」は永遠だ、と続いていきます。",
      author: "ウィリアム・シェイクスピア(1564-1616)。劇作のかたわら154篇のソネットを残しました。thee(=you)、thou art(=you are)は当時の英語です。",
      era: "1590年代、ペストの流行で劇場が閉鎖された時期に多くのソネットが書かれたと考えられています。エリザベス朝の貴族の間ではソネット集が大流行していました。",
      legacy: "英語でもっとも暗唱されている恋愛詩といわれ、結婚式の朗読の定番です。Shall I compare thee... の一行は、数えきれない歌や映画に引用されています。",
    },
  },

  // ---------------- blue(2023年度) ----------------
  {
    id: "blue-april",
    booklet: "blue",
    month: "April",
    monthJa: "4月",
    title: "Teddy Bear, Teddy Bear",
    author: "Mother Goose",
    authorJa: "マザーグース",
    lines: [
      "Teddy bear, teddy bear, turn around!",
      "Teddy bear, teddy bear, touch the ground!",
      "Teddy bear, teddy bear, show your shoe!",
      "Teddy bear, teddy bear, out goes you!",
    ],
    commentary: {
      poem: "「くまさん、くまさん、まわれ!」— 歌に合わせて回ったり地面をさわったり、動きをまねして遊ぶ唄です。around / ground、shoe / you の韻と、同じ呼びかけの繰り返しで、英語の動作のことばが体で覚えられます。なわとび唄としても歌われます。",
      author: "作者不詳の遊び唄で、マザーグースに数えられます。",
      era: "テディベアの名前は、アメリカのセオドア(愛称テディ)・ルーズベルト大統領が1902年に狩りで子グマを撃たなかった逸話から。くまのぬいぐるみの大流行とともに、20世紀はじめにこの唄も広まりました。",
      legacy: "日本のまりつき唄「くまさん くまさん まわれみぎ」はこの唄の翻案といわれています。世界中のなわとび遊びで今も現役です。",
    },
  },
  {
    id: "blue-may",
    booklet: "blue",
    month: "May",
    monthJa: "5月",
    title: "The Tables Turned",
    author: "William Wordsworth",
    authorJa: "ウィリアム・ワーズワース",
    lines: [
      "Up! Up! My friend,",
      "and quit your books;",
      "Or surely you'll grow double;",
      "Up! Up! My friend,",
      "and clear your looks;",
      "Why all this toil and trouble?",
    ],
    commentary: {
      poem: "「立て、立て、友よ。本を閉じよ。そんなに根をつめたら腰が曲がってしまうぞ」— 机にかじりつく友人に、外へ出て自然に学ぼうと呼びかける詩の冒頭です。books / looks、double / trouble の韻。タイトルは「形勢逆転」の意味で、本と自然の立場がひっくり返ります。",
      author: "ウィリアム・ワーズワース(1770-1850)。イギリス湖水地方に暮らし、自然と人の心を歌ったロマン派の代表詩人。のちに桂冠詩人(国を代表する詩人)になりました。",
      era: "1798年、友人コールリッジとの共著詩集『リリカル・バラッズ』に収録。この詩集の出版がイギリス・ロマン主義の幕開けとされています。",
      legacy: "「自然こそ最高の先生」というメッセージは、環境教育や野外学習の場面で今もよく引用されます。",
    },
  },
  {
    id: "blue-june",
    booklet: "blue",
    month: "June",
    monthJa: "6月",
    title: "Vintery, Mintery, Cutery, Corn",
    author: "Mother Goose",
    authorJa: "マザーグース",
    lines: [
      "Vintery, mintery, cutery, corn,",
      "Apple seed and apple thorn;",
      "Wire, briar, limber lock,",
      "Three geese in a flock.",
      "One flew east,",
      "And one flew west,",
      "And one flew over the cuckoo's nest.",
    ],
    commentary: {
      poem: "「ヴィンタリー、ミンタリー」という呪文のような音で始まる古い数え唄。corn / thorn、lock / flock と韻を重ねたあと、3羽のガチョウが1羽は東へ、1羽は西へ、そして最後の1羽は「カッコウの巣の上へ」飛んでいきます。",
      author: "作者不詳のマザーグースです。",
      era: "古いイギリスの数え唄で、19世紀の童謡集に記録されています。",
      legacy: "最終行の one flew over the cuckoo's nest は、ケン・キージーの小説『カッコーの巣の上で』(1962)の題名の由来として有名です。ジャック・ニコルソン主演の映画版はアカデミー賞主要5部門を独占しました。",
    },
  },
  {
    id: "blue-july",
    booklet: "blue",
    month: "July",
    monthJa: "7月",
    title: "The Tyger",
    author: "William Blake",
    authorJa: "ウィリアム・ブレイク",
    lines: [
      "Tyger Tyger, burning bright,",
      "In the forests of the night",
      "What immortal hand or eye,",
      "Could frame thy fearful symmetry?",
      "In what distant deeps or skies.",
      "Burnt the fire of thine eyes?",
    ],
    commentary: {
      poem: "夜の森で燃えるように輝くトラに向かって、「いったいどんな不死の手が、おまえの恐ろしいほどの美しさを作りえたのか」と問いかける詩。bright / night の韻と、太鼓のように刻むリズムが特徴です。問いばかりで答えがないことが、この詩の力になっています。",
      author: "ウィリアム・ブレイク(1757-1827)。オレンジ冊子5月の Piping Down The Valleys Wild と同じ作者です。あちらが『無垢の歌』、こちらは対になる詩集『経験の歌』(1794)の代表作です。",
      era: "フランス革命後の激動期。ブレイクは無垢(子羊)と経験(トラ)という対のイメージで、世界がもつ二つの顔を描きました。",
      legacy: "英語詩の中でもっとも多くアンソロジーに採られた詩のひとつといわれます。Tyger という古風なつづりも含めて、ロックの歌詞からSF小説まで引用が絶えません。",
    },
  },
  {
    id: "blue-september",
    booklet: "blue",
    month: "September",
    monthJa: "9月",
    title: "She Walks in Beauty",
    author: "George Gordon",
    authorJa: "ジョージ・ゴードン(バイロン卿)",
    lines: [
      "She walks in beauty, like the night",
      "Of cloudless climes and starry skies;",
      "And all that's best of dark and bright",
      "Meet in her aspect and her eyes:",
    ],
    commentary: {
      poem: "「彼女は美しさの中を歩む。雲ひとつない土地の、星がきらめく夜のように」。ふつう美しさは光にたとえられますが、この詩は「夜」にたとえ、闇と光のいちばん良いところが彼女の中で出会う、と歌います。night / bright、skies / eyes の韻。",
      author: "ジョージ・ゴードン・バイロン卿(1788-1824)。ロマン派のスター詩人で、詩も生き方も自由奔放。「バイロン的英雄」ということばが生まれるほど、ヨーロッパ中の憧れの的でした。",
      era: "1814年、舞踏会で喪服にきらめく飾りをつけた親戚の夫人を見かけた翌朝に書いたと伝えられます。ナポレオン戦争末期のロンドン社交界の一場面です。",
      legacy: "何度も歌曲になり、朗読会や結婚式の定番です。バイロンはその後ギリシャ独立戦争に身を投じて亡くなり、ギリシャでは今も英雄として敬われています。",
    },
  },
  {
    id: "blue-october",
    booklet: "blue",
    month: "October",
    monthJa: "10月",
    title: "The Eency Weency Spider",
    authorJa: "伝承童謡",
    lines: [
      "The eency weency spider",
      "climbed up the water spout,",
      "down came the rain and",
      "washed the spider out!",
    ],
    commentary: {
      poem: "ちっちゃなクモが雨どいを登っていくと、雨が降ってきて流されてしまう — 指をクモに見立ててのぼるまねをしながら歌う手遊び唄です。このあと「お日さまが出て、クモはまた登る」と続き、あきらめない小さなクモの物語になります。",
      author: "作者不詳。20世紀はじめのアメリカで記録された手遊び唄です。",
      era: "1910〜20年代の童謡集やキャンプソング集に登場し、親子の遊び唄として広まりました。",
      legacy: "アメリカでは Itsy Bitsy Spider、イギリスやオーストラリアでは Incy Wincy Spider と呼ばれます。世界中の親子が指遊びつきで歌う、英語圏でもっとも有名な手遊び唄のひとつです。",
    },
  },
  {
    id: "blue-november",
    booklet: "blue",
    month: "November",
    monthJa: "11月",
    title: "The Last Rose of Summer",
    author: "Thomas Moore",
    authorJa: "トマス・ムーア",
    lines: [
      "'Tis the last rose of summer,",
      "Left blooming alone;",
      "All her lovely companions",
      "Are faded and gone;",
      "No flower of her kindred,",
      "No rosebud is nigh,",
      "To reflect back her blushes,",
      "Or give sigh for sigh.",
    ],
    commentary: {
      poem: "夏の終わり、仲間がみな散ったあとに一輪だけ咲き残ったバラ。その姿に、大切な人たちを見送ったあとの寂しさを重ねる詩です。alone / gone、nigh / sigh の韻が、ため息のような余韻を残します。",
      author: "トマス・ムーア(1779-1852)。アイルランドの国民的詩人。自作の詩を古い民謡の旋律にのせた『アイルランド歌曲集』で、19世紀のヨーロッパ中に愛されました。",
      era: "1805年の作。イギリス統治下のアイルランドで、失われてゆくものへの哀惜が歌に込められた時代でした。",
      legacy: "日本では明治時代に「庭の千草」という唱歌になり、今も歌い継がれています。オペラ『マルタ』の中でも歌われ、フルートの名曲としても世界中で演奏されています。",
    },
  },
  {
    id: "blue-december",
    booklet: "blue",
    month: "December",
    monthJa: "12月",
    title: "Pippa's Song",
    author: "Robert Browning",
    authorJa: "ロバート・ブラウニング",
    lines: [
      "The year's at the spring,",
      "And day's at the morn;",
      "Morning's at seven;",
      "The hill-side's dew-pearl'd;",
      "The lark's on the wing;",
      "The snail's on the thorn;",
      "God's in His heaven--",
      "All's right with the world!",
    ],
    commentary: {
      poem: "「時は春、日は朝。朝は七時、丘は露にきらめき、ひばりは空に、かたつむりは枝に。神は天にいまし、すべて世は事もなし」。劇詩『ピッパが通る』で、糸まき工場で働く少女ピッパが歌いながら町を通ると、聞いた人々の心が変わっていく — その歌の部分です。",
      author: "ロバート・ブラウニング(1812-1889)。ヴィクトリア朝を代表するイギリスの詩人。妻は同じく詩人のエリザベス・バレット・ブラウニングで、二人の恋文は文学史の有名なエピソードです。",
      era: "1841年発表。舞台はイタリアの絹糸工場で働く少女の一日。産業化の時代に、働く子どもの無垢な歌が世界を動かすという物語でした。",
      legacy: "上田敏の名訳「春の朝(はるのあした)」(訳詩集『海潮音』1905)で日本でも有名になり、「すべて世は事もなし」は日本語の決まり文句になりました。『赤毛のアン』の結びの一文にも引用されています。",
    },
  },
  {
    id: "blue-january",
    booklet: "blue",
    month: "January",
    monthJa: "1月",
    title: "Amazing Grace",
    author: "John Newton",
    authorJa: "ジョン・ニュートン",
    lines: [
      "Amazing grace!",
      "how sweet the sound",
      "That saved a wretch like me.",
      "I once was lost,",
      "but now I'm found",
      "Was blind, but now I see.",
    ],
    commentary: {
      poem: "「おどろくばかりの恵み。なんと美しい響きだろう。私のような迷える者さえ救われた」。自分の過ちを見つめ、赦されたことへの感謝を歌う讃美歌です。sound / found、me / see の韻。lost と found、blind と see の対比が歌の芯になっています。",
      author: "ジョン・ニュートン(1725-1807)。若い頃は奴隷貿易船の船長でしたが、嵐で九死に一生を得たことから回心し、のちに牧師となってこの詞を書きました。",
      era: "1772年頃に書かれ、1779年の『オルニー讃美歌集』に収録。晩年のニュートンは奴隷貿易廃止運動を支え、その証言は1807年のイギリス奴隷貿易廃止法につながりました。",
      legacy: "今歌われるメロディは1835年にアメリカでつけられたものです。公民権運動で歌われ、追悼式典やバグパイプの定番として、国や宗教を超えて世界中で歌われ続けています。",
    },
  },
  {
    id: "blue-february",
    booklet: "blue",
    month: "February",
    monthJa: "2月",
    title: "Song of the Witches",
    author: "William Shakespeare",
    authorJa: "ウィリアム・シェイクスピア",
    lines: [
      "Round about the cauldron go:",
      "In the poisoned entrails throw.",
      "Toad, that under cold stone",
      "Days and nights has thirty-one",
      "Sweated venom sleeping got,",
      "Boil thou first i' the charmed pot.",
      "Double, double toil and trouble;",
      "Fire burn and cauldron bubble.",
    ],
    commentary: {
      poem: "悲劇『マクベス』で、3人の魔女が大鍋のまわりをぐるぐる回りながら唱える呪文。「ダブル、ダブル、トイル・アンド・トラブル」の一行は英語でいちばん有名な呪文といわれます。go / throw、trouble / bubble の強い韻が、ぐつぐつ煮える鍋のリズムそのものです。",
      author: "ウィリアム・シェイクスピア(1564-1616)。オレンジ冊子にも3作品が登場する、この教材の最多出演作家です。",
      era: "1606年頃の作。ときの国王ジェームズ1世は魔女研究の本を書くほど魔女裁判に関心が強く、その時代の空気の中でこの魔女の場面は書かれました。",
      legacy: "劇場では『マクベス』の題名を口にすると不吉という迷信(「スコットランドの劇」と呼びかえる)があるほどの有名作。この呪文は映画『ハリー・ポッターとアズカバンの囚人』で合唱曲にもなりました。",
    },
  },
  {
    id: "blue-march",
    booklet: "blue",
    month: "March",
    monthJa: "3月",
    title: "The Queen of Hearts",
    author: "Mother Goose",
    authorJa: "マザーグース",
    lines: [
      "The Queen of Hearts",
      "she made some tarts",
      "all on a summer's day;",
      "The Knave of Hearts",
      "he stole the tarts",
      "and took them clean away.",
      "The King of Hearts",
      "called for the tarts",
      "and beat the Knave full sore",
      "The Knave of Hearts",
      "brought back the tarts",
      "and vowed he'd steal no more.",
    ],
    commentary: {
      poem: "ハートの女王がタルトを焼き、ジャック(Knave)が盗み、王さまに叱られて返しました、という起承転結のあるお話し唄。Hearts / tarts の韻が3回まわってきて、トランプの絵札がそのまま動き出したような楽しさがあります。",
      author: "作者不詳のマザーグースです。",
      era: "1782年にイギリスの雑誌に掲載されたのが最初の記録。トランプ遊びが大流行していた時代の唄です。",
      legacy: "ルイス・キャロル『不思議の国のアリス』(1865)のクライマックス「タルトを盗んだのは誰だ」の裁判は、この唄がもとになっています。アリスに出てくるハートの女王のイメージの原点です。",
    },
  },
];

/** 冊子ごとの詩一覧(冊子内の月順を保つ) */
export function poemsByBooklet(booklet: Booklet): RhymePoem[] {
  return POEMS.filter((poem) => poem.booklet === booklet);
}
