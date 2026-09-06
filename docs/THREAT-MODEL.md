# TaskTrace — Threat model v0.2

## Addendum v0.3 — 06/09/2026, review resilience

Receipt live đầu tiên báo thiếu citation nguồn/sản phẩm. Sửa prompt bằng output skeleton sinh từ obligation/chunk IDs đã xác minh; không sinh verdict hoặc quote mặc định. Mỗi node được thử tối đa hai lần tạo output trên cùng toàn bộ snapshot, chỉ khi parser báo lỗi `[LLM_ERROR]`. Không retry một output đã hợp lệ để chọn verdict thuận lợi. Lần hai vẫn lỗi thì fail closed/validator disagree, không phát hành credit hoặc biến lỗi thành UNASSESSABLE. Không đưa output lỗi trở lại prompt; chỉ dùng chẩn đoán từ parser để giảm đường prompt injection. Giới hạn này không giới hạn số giao dịch người dùng có thể gửi trong cửa sổ review; script giới hạn rotation và lưu mọi giao dịch. Chi phí và latency tăng tối đa một lần derive mỗi node, cần đo trên StudioNet.

Ngày: 05/09/2026. Trạng thái: thiết kế đã tự rà soát, chưa kiểm chứng bằng test hoặc audit độc lập.

## Tài sản và biên tin cậy

Tài sản: tiền công/bond, quyền nhận việc, nghĩa vụ và bản giao bất biến, kết luận và lịch sử công việc.

MVP nhận source/A/B trực tiếp trong contract. Source là căn cứ do khách hàng cung cấp và các bên chấp nhận trước active. Hệ thống xác minh trung thực với căn cứ đó; không chứng minh source mô tả đúng thế giới.

Issuer được xác định bởi sender của giao dịch và vai trò job. Không tin trường author do frontend cung cấp. Hash chứng minh nội dung/bản giao không thay đổi, không chứng minh chất lượng. Người dùng/browser và LLM output đều có thể độc hại.

## Nguy cơ và biện pháp

| Nguy cơ | Biện pháp | Kiểm thử |
| --- | --- | --- |
| Đổi điều khoản sau nhận việc | Khóa rubric/version/obligation IDs khi active | Sửa rubric sau accept |
| Tráo artifact | Full bytes lưu bất biến, SHA-256, revision | Đổi một byte hoặc ID |
| Giả issuer hoặc vai trò | Sender on-chain và role binding | Ví không được chỉ định nộp bài |
| B đổi đầu vào A | Bind upstream submission ID | Dùng revision A khác |
| Replay khác job/chain/contract | Domain binding đầy đủ | Chuyển proof sang job khác |
| Leader JSON hợp lệ nhưng sai | Validator đọc cùng snapshot và tự đánh giá | Sai A/B nhưng đúng schema |
| Bỏ nghĩa vụ | Exact obligation ID set, một assessment/ID | Thiếu/thừa/trùng |
| Bỏ phần cuối tài liệu | Full-byte review, đủ chunks | Ngoại lệ/injection chunk cuối |
| Prompt injection | Data delimiters, không thực thi code/URL từ LLM, độc lập đối chiếu | Giả instruction hoặc verdict |
| Phạt B chỉ vì A sai | Xét nghĩa vụ độc lập, dependency đã khóa | A sai/B trung thực |
| LLM chọn tiền/thời hạn | Quy tắc deterministic, F/B/P cố định | Response có recipient/amount tự chèn |
| Lặp review để chọn kết quả | Một review active trên snapshot, retry policy | Resolve sau decided |
| Khóa tiền do im lặng | Timeout/cancel đã thống nhất | Không nộp hoặc client im lặng |
| Double claim / race | Settlement ID, lock, conservation invariant | Claim lặp, refund-vs-claim |
| Thanh toán ảo | Finality, execution/message/recipient/amount match | Parent success/child error |
| Lộ khóa | Local .env, ignore, redaction, bundle scan | Source/history/build scan |
| Cạn phí | Byte caps, fee estimate, giới hạn retry và reserve | Dữ liệu lớn/LLM lỗi lặp |

## Rủi ro còn lại

- Validators có thể cùng hiểu sai; consensus không bảo đảm chân lý.
- Bộ nguồn được các bên chấp nhận có thể thiếu hoặc sai về thế giới thực.
- Lưu văn bản trên-chain có phí và công khai; bản đầu chỉ dùng tài liệu không bí mật.
- Hủy trung lập phần không thể kết luận có thể khiến người làm mất công; điều khoản phải nói rõ.
- Ví khác nhau không chứng minh người vận hành khác nhau; chưa chống Sybil.
- Nhu cầu khách hàng trả tiền chưa được xác thực.

## Quan hệ với AGENTS.md

Đây là thiết kế nhận bằng chứng qua giao dịch đã xác thực, không có external URL evidence adapter. Với dữ liệu on-chain, canonical origin là network/contract, issuer là sender, immutable artifact identity là job/stage/revision/hash; mỗi node đọc snapshot có thẩm quyền.

Nếu mở nguồn web sau này phải thực hiện đầy đủ các gate repo/owner/immutable version/redirect/full-artifact theo AGENTS.md; không coi việc bỏ web trong MVP là đã giải quyết provenance của web.
