package main

import (
	"bytes"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"path"
	"strings"

	"github.com/d4l3k/go-electrum/electrum"
)

// NOTE: This was initially hacked together for a demo. It doesn't do proper
// error checking etc. If this comment is still here it's probably not ready
// yet.

const PathBroadcastTransaction = "/transaction/broadcast"
const PathDecodeTransaction = "/transaction/decode"
const PathPSBT = "/transaction/psbt"

var LBRYCRD = path.Join(LBRYCRD_PATH, "lbrycrd-cli")

var node *electrum.Node

func getUnspentForAmount(
	outputAddress string,
	desiredAmount float64,
) (inputs []*electrum.Transaction, totalAmount float64, enough bool) {
	unspent, _ := node.BlockchainAddressListUnspent(outputAddress)
	for _, u := range unspent {
		if desiredAmount > totalAmount {
			totalAmount += float64(u.Value) / 100000000.0
			inputs = append(inputs, u)
		}
	}
	if desiredAmount <= totalAmount {
		enough = true
	}
	return
}

func makePsbt(inputs []*electrum.Transaction, outputAddress string, amount float64) (string, error) {
	var inputTxnParts []string
	for _, input := range inputs {
		inputTxnParts = append(
			inputTxnParts,
			fmt.Sprintf(`{"txid": "%s", "vout": %d}`, input.Hash, input.Pos),
		)
	}
	var inputTxnsParam = "[" + strings.Join(inputTxnParts, ", ") + "]"
	var outputAddressesParam = fmt.Sprintf(`[{"%s": %f}]`, outputAddress, amount)

	var out bytes.Buffer
	var errOut bytes.Buffer
	fmt.Println(LBRYCRD, "createpsbt", string(inputTxnsParam), string(outputAddressesParam))
	cmd := exec.Command(LBRYCRD, "createpsbt", string(inputTxnsParam), string(outputAddressesParam))
	cmd.Stdout = &out
	cmd.Stderr = &errOut

	err := cmd.Run()
	if err != nil {
		fmt.Println(err.Error())
		fmt.Println(out.String())
		fmt.Println(errOut.String())
		return "", err
	} else {
		psbtBytes, err := base64.StdEncoding.DecodeString(out.String())
		if err != nil {
			fmt.Println(err.Error())
		}
		return hex.EncodeToString(psbtBytes), nil
	}
}

func decodeTransaction(txn string) (decoded string, err error) {
	var out bytes.Buffer
	var errOut bytes.Buffer
	cmd := exec.Command(LBRYCRD, "decoderawtransaction", txn)
	cmd.Stdout = &out
	cmd.Stderr = &errOut

	err = cmd.Run()
	if err != nil {
		err = fmt.Errorf(err.Error() + "\n" + out.String() + "\n" + errOut.String())
	} else {
		decoded = out.String()
	}

	return
}

func generateBlockRegtest() (cmdOut string, err error) {
	var out bytes.Buffer
	var errOut bytes.Buffer
	cmd := exec.Command(LBRYCRD, "generate", "1")
	cmd.Stdout = &out
	cmd.Stderr = &errOut

	err = cmd.Run()
	if err != nil {
		err = fmt.Errorf(err.Error() + "\n" + out.String() + "\n" + errOut.String())
	} else {
		cmdOut = out.String()
	}

	return
}

func main() {
	// TODO Throw error if lbrycrdd is not running on mainnet

	node = electrum.NewNode()
	if err := node.ConnectTCP(ELECTRUM_SERVER); err != nil {
		log.Fatal(err)
	}

	http.HandleFunc(PathBroadcastTransaction, broadcastTransaction)
	http.HandleFunc(PathDecodeTransaction, getDecodedTransaction)
	http.HandleFunc(PathPSBT, getPSBT)

	fmt.Println("Serving at :8090")
	http.ListenAndServe(":8090", nil)
}

type BroadcastTransactionRequest struct {
	TransactionHex string `json:"transactionHex"`
}

type DecodeTransactionRequest struct {
	TransactionHex string `json:"transactionHex"`
}

type PSBTRequest struct {
	ToAddress     string  `json:"toAddress"`
	FromAddress   string  `json:"fromAddress"`
	DesiredAmount float64 `json:"desiredAmount"`
}

type PSBTResponse struct {
	NonWitnessUtxoHexes []string `json:"nonWitnessUtxoHex"`
	PSBTHex             string   `json:"psbtHex"`
	Error               string   `json:"error"`
	ActualAmount        float64  `json:"actualAmount"`
}

func getPSBT(w http.ResponseWriter, req *http.Request) {
	var psbtr PSBTRequest
	var pr PSBTResponse

	if err := json.NewDecoder(req.Body).Decode(&psbtr); err != nil {
		http.Error(w, string("Malformed request body JSON"), http.StatusBadRequest)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", CORS)

	outputs, actualAmount, success := getUnspentForAmount(psbtr.FromAddress, psbtr.DesiredAmount)

	if !success {
		pr = PSBTResponse{Error: "Not enough funds"}
		response, _ := json.Marshal(pr)
		fmt.Fprintf(w, string(response))
		return
	}

	// Doing the `desiredAmount` so that the remainder can go to fees. This
	// might lead to super high fees but the server would stop us from
	// broadcasting it. If we used `actualAmount`, we'd have zero fees. If we
	// used `actualAmount` minus fees, it might be way more than `desiredAmount`
	// and the server *wouldn't* stop us from broadcasting.
	psbt, err := makePsbt(outputs, psbtr.ToAddress, psbtr.DesiredAmount)

	if err != nil {
		pr = PSBTResponse{Error: "getPsbt - err: " + err.Error()}
		response, _ := json.Marshal(pr)
		http.Error(w, string(response), http.StatusInternalServerError)
		return
	}

	var fullTxns []string
	for _, output := range outputs {
		fullTxn, err := node.BlockchainTransactionGet(output.Hash)
		if err != nil {
			pr = PSBTResponse{Error: "getPsbt - err: " + err.Error()}
			response, _ := json.Marshal(pr)
			http.Error(w, string(response), http.StatusInternalServerError)
			return
		}
		fullTxns = append(fullTxns, fullTxn)
	}

	pr = PSBTResponse{
		NonWitnessUtxoHexes: fullTxns,
		PSBTHex:             psbt,
		ActualAmount:        actualAmount,
	}
	// TODO - is this check future-proof enough? (change in prices, etc)
	if actualAmount-psbtr.DesiredAmount > 0.01 {
		pr.Error = "Absurdly high fee"
	}
	response, _ := json.Marshal(pr)
	fmt.Fprintf(w, string(response))

	fmt.Println("get psbt")
}

type BroadcastTransactionResponse struct {
	Txid string `json:"txid"`
}

func broadcastTransaction(w http.ResponseWriter, req *http.Request) {
	var btr BroadcastTransactionRequest

	if err := json.NewDecoder(req.Body).Decode(&btr); err != nil {
		http.Error(w, string("Malformed request body JSON"), http.StatusBadRequest)
		return
	}

	// TODO need some sort of actual feedback for web app for errors

	w.Header().Set("Access-Control-Allow-Origin", CORS)

	broadcastResult, err := node.BlockchainTransactionBroadcast([]byte(btr.TransactionHex))
	if err != nil {
		fmt.Println("broadcast failure")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	broadcastResultStr := fmt.Sprintf("+v", broadcastResult)

	btresp := BroadcastTransactionResponse{Txid: broadcastResultStr}
	response, _ := json.Marshal(btresp)
	fmt.Fprintf(w, string(response))
	fmt.Println("broadcast success:\n" + broadcastResultStr)

	return
}

type DecodeTransactionResponse struct {
	DecodedTransaction string `json:"decodedTransaction"`
}

func getDecodedTransaction(w http.ResponseWriter, req *http.Request) {
	var dtr DecodeTransactionRequest

	if err := json.NewDecoder(req.Body).Decode(&dtr); err != nil {
		http.Error(w, string("Malformed request body JSON"), http.StatusBadRequest)
		return
	}

	// TODO need some sort of actual feedback for web app for errors

	w.Header().Set("Access-Control-Allow-Origin", CORS)

	decodedTransaction, err := decodeTransaction(dtr.TransactionHex)
	if err != nil {
		fmt.Println("decode failure")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dtresp := DecodeTransactionResponse{
		DecodedTransaction: decodedTransaction,
	}
	response, _ := json.Marshal(dtresp)
	fmt.Fprintf(w, string(response))
	fmt.Printf(decodedTransaction)
	fmt.Println("decode success")

	return
}
