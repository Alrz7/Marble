package internal

type Duration struct {
	Week      int `json:"week"`
	Day       int `json:"day"`
	Hour      int `json:"hour"`
	Minute    int `json:"minute"`
	Second    int `json:"second"`
	InSeconds int `json:"-"`
}

